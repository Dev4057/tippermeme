import express, { Request, Response } from 'express';
import { 
  create402Response, 
  verifyX402Payment,
  calculateAmounts 
} from '../services/x402';
import { 
  getMemeById, 
  createTip,
  checkTxHashExists 
} from '../services/database';

const router = express.Router();

// ══════════════════════════════════════════════════════
//           TIP ENDPOINT (X402 IMPLEMENTATION)
// ══════════════════════════════════════════════════════

router.post('/:memeId', async (req: Request, res: Response) => {
  const { memeId } = req.params;
  const xPaymentHeader = req.headers['x-payment'] as string;

  console.log('\n💰 Tip request received for meme:', memeId);

  try {
    // ──────────────────────────────────────────────────
    // 1. Get meme details
    // ──────────────────────────────────────────────────
    const meme = await getMemeById(memeId);
    
    if (!meme) {
      return res.status(404).json({ 
        error: 'Meme not found' 
      });
    }

    // ──────────────────────────────────────────────────
    // 2. Check if payment header exists
    // ──────────────────────────────────────────────────
    if (!xPaymentHeader) {
      console.log('❌ No X-PAYMENT header found');
      console.log('📤 Returning 402 Payment Required');

      // Return 402 Payment Required
      const payment402 = create402Response(
        `/api/tips/${memeId}`,
        '0.10', // Fixed $0.10 tip
        meme.creator_wallet,
        `Tip for meme: ${meme.caption || 'Untitled'}`
      );

      return res.status(402).json(payment402);
    }

    console.log('✅ X-PAYMENT header found, verifying...');

    // ──────────────────────────────────────────────────
    // 3. Verify payment
    // ──────────────────────────────────────────────────
    const useMockMode = process.env.NODE_ENV === 'development'; // Use mock in dev
    
    const verification = await verifyX402Payment(
      xPaymentHeader,
      '0.10', // Expected amount
      meme.creator_wallet, // Expected recipient
      useMockMode
    );

    if (!verification.valid) {
      console.error('❌ Payment verification failed:', verification.error);
      
      return res.status(400).json({
        error: 'Payment verification failed',
        details: verification.error
      });
    }

    // ──────────────────────────────────────────────────
    // 4. Check for duplicate transaction
    // ──────────────────────────────────────────────────
    if (verification.transactionHash) {
      const isDuplicate = await checkTxHashExists(verification.transactionHash);
      
      if (isDuplicate) {
        console.log('⚠️  Duplicate transaction detected');
        
        return res.status(409).json({
          error: 'This transaction has already been processed'
        });
      }
    }

    // ──────────────────────────────────────────────────
    // 5. Calculate amounts
    // ──────────────────────────────────────────────────
    const amounts = calculateAmounts(0.10);

    console.log('💵 Payment breakdown:');
    console.log('   Total: $', amounts.total);
    console.log('   Platform fee: $', amounts.platformFee);
    console.log('   Creator receives: $', amounts.creatorReceives);

    // ──────────────────────────────────────────────────
    // 6. Save tip to database
    // ──────────────────────────────────────────────────
    
    // Extract from wallet from payment (you'd decode this from header)
    // For now, we'll use a placeholder
    const fromWallet = '0xTipperWallet...'; // TODO: Extract from X-PAYMENT header

    const tip = await createTip({
      meme_id: memeId,
      from_wallet: fromWallet,
      to_wallet: meme.creator_wallet,
      amount: amounts.creatorReceives,
      tx_hash: verification.transactionHash || 'mock-tx-' + Date.now()
    });

    console.log('✅ Tip saved to database');
    console.log('🎉 Tip completed successfully!\n');

    // ──────────────────────────────────────────────────
    // 7. Return success
    // ──────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: 'Tip received successfully',
      tip: {
        id: tip.id,
        amount: amounts.total,
        creatorReceives: amounts.creatorReceives,
        platformFee: amounts.platformFee,
        transactionHash: verification.transactionHash,
        timestamp: tip.created_at
      },
      meme: {
        id: meme.id,
        newTipCount: meme.tip_count + 1,
        newTotalEarned: meme.total_earned + amounts.creatorReceives
      }
    });

  } catch (error) {
    console.error('❌ Error processing tip:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ══════════════════════════════════════════════════════
//              GET TIPS FOR A MEME
// ══════════════════════════════════════════════════════

router.get('/:memeId', async (req: Request, res: Response) => {
  const { memeId } = req.params;

  try {
    const { getTipsByMeme } = await import('../services/database');
    const tips = await getTipsByMeme(memeId);

    return res.json({
      meme_id: memeId,
      tips: tips
    });

  } catch (error) {
    console.error('Error fetching tips:', error);
    return res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

export default router;