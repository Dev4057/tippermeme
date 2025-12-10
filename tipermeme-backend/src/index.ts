import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import memesRouter from './routes/memes';
import tipsRouter from './routes/tips';


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'TipPerMeme API is running! 🚀',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/memes', memesRouter);
app.use('/api/tips', tipsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Network: ${process.env.NETWORK}`);
});