import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { PaymentRequiredResponse, X402Payment, VerificationResponse } from '../types';

// ══════════════════════════════════════════════════════
//                X402 PAYMENT SERVICE
// ══════════════════════════════════════════════════════

const USDC_ADDRESS = process.env.USDC_CONTRACT!;
const NETWORK = process.env.NETWORK || 'base-mainnet';
const FACILITATOR_URL = process.env.FACILITATOR_URL!;

// ──────────────────────────────────────────────────────
// 1. CREATE 402 PAYMENT REQUIRED RESPONSE
// ──────────────────────────────────────────────────────

export function create402Response(
  resource: string,
  amount: string,
  creatorWallet: string,
  description: string
): PaymentRequiredResponse {
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Valid for 10 minutes

  return {
    maxAmountRequired: amount,
    resource: resource,
    description: description,
    payTo: creatorWallet,
    asset: USDC_ADDRESS,
    network: NETWORK,
    nonce: uuidv4(),
    expiresAt: expiresAt.toISOString()
  };
}

// ──────────────────────────────────────────────────────
// 2. DECODE X-PAYMENT HEADER
// ──────────────────────────────────────────────────────

export function decodeX402Payment(xPaymentHeader: string): X402Payment | null {
  try {
    // Decode base64
    const decoded = Buffer.from(xPaymentHeader, 'base64').toString('utf-8');
    
    // Parse JSON
    const payment: X402Payment = JSON.parse(decoded);
    
    // Basic validation
    if (!payment.scheme || !payment.network || !payment.asset || !payment.payment) {
      console.error('Invalid payment structure');
      return null;
    }

    return payment;
  } catch (error) {
    console.error('Failed to decode X-PAYMENT header:', error);
    return null;
  }
}

// ──────────────────────────────────────────────────────
// 3. VERIFY PAYMENT SIGNATURE (Local verification)
// ──────────────────────────────────────────────────────

export function verifyPaymentSignature(payment: X402Payment): boolean {
  try {
    const { from, to, value, validAfter, validBefore, nonce, signature } = payment.payment;

    // Check timestamp validity
    const now = Math.floor(Date.now() / 1000);
    if (now < validAfter || now > validBefore) {
      console.error('Payment timestamp invalid');
      return false;
    }

    // Create EIP-712 domain
    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: NETWORK === 'base-mainnet' ? 8453 : 84532, // Base mainnet or testnet
      verifyingContract: payment.asset
    };

    // Create EIP-712 types
    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    // Create message
    const message = {
      from,
      to,
      value,
      validAfter,
      validBefore,
      nonce
    };

    // Recover signer address
    const recoveredAddress = ethers.verifyTypedData(
      domain,
      types,
      message,
      signature
    );

    // Check if signer matches 'from' address
    const isValid = recoveredAddress.toLowerCase() === from.toLowerCase();
    
    if (!isValid) {
      console.error('Signature verification failed');
      console.error('Expected:', from);
      console.error('Recovered:', recoveredAddress);
    }

    return isValid;

  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// ──────────────────────────────────────────────────────
// 4. VERIFY WITH FACILITATOR (Coinbase CDP)
// ──────────────────────────────────────────────────────

export async function verifyWithFacilitator(
  payment: X402Payment
): Promise<VerificationResponse> {
  try {
    console.log('🔍 Verifying payment with facilitator...');

    const response = await fetch(`${FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: payment.payment,
        network: payment.network,
        asset: payment.asset
      })
    });

    if (!response.ok) {
      // Explicitly type the structure we expect
      const errorData = (await response.json()) as {
        error?: string;
        message?: string;
      };

      console.error('Facilitator error:', errorData);

      return {
        valid: false,
        error:
          errorData.error ??
          errorData.message ??
          'Facilitator verification failed'
      };
    }

    // Result is known to match VerificationResponse
    const result = (await response.json()) as VerificationResponse;

    console.log('✅ Facilitator verification result:', result);

    return result;

  } catch (error) {
    console.error('Error calling facilitator:', error);

    return {
      valid: false,
      error: 'Failed to connect to payment facilitator'
    };
  }
}

// ──────────────────────────────────────────────────────
// 5. MOCK VERIFICATION (For testing without facilitator)
// ──────────────────────────────────────────────────────

export async function mockVerification(
  payment: X402Payment
): Promise<VerificationResponse> {
  
  console.log('⚠️  MOCK MODE: Simulating payment verification...');
  
  // Verify signature locally
  const signatureValid = verifyPaymentSignature(payment);
  
  if (!signatureValid) {
    return {
      valid: false,
      error: 'Invalid signature'
    };
  }

  // Simulate successful transaction
  const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
  
  return {
    valid: true,
    transactionHash: mockTxHash,
    blockNumber: Math.floor(Math.random() * 1000000) + 10000000,
    confirmed: true
  };
}

// ──────────────────────────────────────────────────────
// 6. MAIN VERIFICATION FUNCTION (Use this in routes!)
// ──────────────────────────────────────────────────────

export async function verifyX402Payment(
  xPaymentHeader: string,
  expectedAmount: string,
  expectedRecipient: string,
  useMock: boolean = false
): Promise<VerificationResponse> {
  
  console.log('\n🔐 Starting X402 payment verification...');
  
  // Step 1: Decode payment
  const payment = decodeX402Payment(xPaymentHeader);
  if (!payment) {
    return {
      valid: false,
      error: 'Failed to decode X-PAYMENT header'
    };
  }

  console.log('✅ Payment decoded successfully');

  // Step 2: Verify basic requirements
  if (payment.network !== NETWORK) {
    return {
      valid: false,
      error: `Invalid network. Expected ${NETWORK}, got ${payment.network}`
    };
  }

  if (payment.asset.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
    return {
      valid: false,
      error: 'Invalid token. Only USDC is accepted'
    };
  }

  // Step 3: Verify amount
  const paymentAmount = ethers.formatUnits(payment.payment.value, 6); // USDC has 6 decimals
  const expectedAmountNum = parseFloat(expectedAmount);
  const paymentAmountNum = parseFloat(paymentAmount);

  if (paymentAmountNum < expectedAmountNum) {
    return {
      valid: false,
      error: `Insufficient amount. Expected ${expectedAmount}, got ${paymentAmount}`
    };
  }

  console.log('✅ Amount verified:', paymentAmount, 'USDC');

  // Step 4: Verify recipient
  if (payment.payment.to.toLowerCase() !== expectedRecipient.toLowerCase()) {
    return {
      valid: false,
      error: 'Invalid recipient address'
    };
  }

  console.log('✅ Recipient verified');

  // Step 5: Verify signature locally
  const signatureValid = verifyPaymentSignature(payment);
  if (!signatureValid) {
    return {
      valid: false,
      error: 'Invalid payment signature'
    };
  }

  console.log('✅ Signature verified');

  // Step 6: Verify with facilitator (or mock)
  let verification: VerificationResponse;
  
  if (useMock) {
    verification = await mockVerification(payment);
  } else {
    verification = await verifyWithFacilitator(payment);
  }

  if (!verification.valid) {
    console.error('❌ Verification failed:', verification.error);
    return verification;
  }

  console.log('✅ Payment verified successfully!');
  console.log('📝 Transaction hash:', verification.transactionHash);
  console.log('─────────────────────────────────────\n');

  return verification;
}

// ──────────────────────────────────────────────────────
// 7. CALCULATE PLATFORM FEE & CREATOR AMOUNT
// ──────────────────────────────────────────────────────

export function calculateAmounts(totalAmount: number) {
  const platformFeePercent = parseFloat(process.env.PLATFORM_FEE || '0.05');
  const platformFee = totalAmount * platformFeePercent;
  const creatorAmount = totalAmount - platformFee;

  return {
    total: totalAmount,
    platformFee: platformFee,
    creatorReceives: creatorAmount
  };
}