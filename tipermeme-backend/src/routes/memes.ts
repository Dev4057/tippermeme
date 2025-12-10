import express, { Request, Response } from 'express';
import multer from 'multer';
import { 
  createMeme, 
  getMemes, 
  getMemeById,
  getOrCreateCreator 
} from '../services/database';

const router = express.Router();

// Configure multer for file upload (memory storage for now)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// ══════════════════════════════════════════════════════
//                  GET ALL MEMES (FEED)
// ══════════════════════════════════════════════════════

router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log(`📜 Fetching memes (limit: ${limit}, offset: ${offset})`);

    const memes = await getMemes(limit, offset);

    return res.json({
      memes: memes,
      count: memes.length,
      limit: limit,
      offset: offset
    });

  } catch (error) {
    console.error('Error fetching memes:', error);
    return res.status(500).json({ error: 'Failed to fetch memes' });
  }
});

// ══════════════════════════════════════════════════════
//                  GET SINGLE MEME
// ══════════════════════════════════════════════════════

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const meme = await getMemeById(id);

    if (!meme) {
      return res.status(404).json({ error: 'Meme not found' });
    }

    return res.json(meme);

  } catch (error) {
    console.error('Error fetching meme:', error);
    return res.status(500).json({ error: 'Failed to fetch meme' });
  }
});

// ══════════════════════════════════════════════════════
//                  UPLOAD MEME
// ══════════════════════════════════════════════════════

router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { creator_wallet, caption, category } = req.body;
    const file = req.file;

    console.log('\n📤 Upload request received');
    console.log('Creator:', creator_wallet);
    console.log('Caption:', caption);
    console.log('File:', file?.originalname);

    // Validate inputs
    if (!creator_wallet) {
      return res.status(400).json({ error: 'creator_wallet is required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(creator_wallet)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Get or create creator
    await getOrCreateCreator(creator_wallet);

    // For now, we'll store image as base64 data URL
    // Later: Upload to Supabase Storage or Cloudflare R2
    const imageDataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    // TODO: Replace with actual image upload service
    // const imageUrl = await uploadToStorage(file);

    // Create meme in database
    const meme = await createMeme({
      creator_wallet: creator_wallet,
      image_url: imageDataUrl, // Using data URL for now
      caption: caption || '',
      category: category || 'humor'
    });

    console.log('✅ Meme created:', meme.id);

    return res.status(201).json({
      success: true,
      message: 'Meme uploaded successfully',
      meme: meme
    });

  } catch (error) {
    console.error('Error uploading meme:', error);
    return res.status(500).json({ 
      error: 'Failed to upload meme',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;