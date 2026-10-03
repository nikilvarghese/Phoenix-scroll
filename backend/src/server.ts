import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';
import { seedInitialData } from './utils/seedData.js';
import authRoutes from './routes/authRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import chapterRoutes from './routes/chapterRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { upload } from './middleware/uploadMiddleware.js';
import { authenticate, requireOwner } from './middleware/authMiddleware.js';
import { authRateLimiter, apiRateLimiter } from './middleware/rateLimiter.js';
import { loggerMiddleware } from './middleware/loggerMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { cacheControl } from './middleware/cacheMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'sameorigin' },
  })
);

// Ensure DB connection for serverless/service requests
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in middleware:', err);
  }
  next();
});

// Structured Request Logging
app.use(loggerMiddleware);

// Explicit CORS Origin Allowlist
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. same-origin static bundles, mobile tools, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Origin not allowed.'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded Files
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Monitoring Health Endpoint
app.use('/api/health', healthRoutes);

// Auth Routes with Strict Rate Limiter
app.use('/api/auth', authRateLimiter, authRoutes);

// Story Routes with Caching & Rate Limiting
app.use('/api/stories', apiRateLimiter, cacheControl(300), storyRoutes);

// Chapter Routes with Rate Limiting
app.use('/api/chapters', apiRateLimiter, chapterRoutes);

// Reading Progress Routes
app.use('/api/progress', apiRateLimiter, progressRoutes);

// Image Upload Endpoint
app.post('/api/uploads/image', authenticate, requireOwner, (req, res) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Failed to process uploaded image.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  });
});

// Serve Static Frontend Bundle in Production
const frontendDistPath = path.join(process.cwd(), '../frontend/dist');
const localDistPath = path.join(process.cwd(), 'frontend/dist');
const distPath = fs.existsSync(frontendDistPath) ? frontendDistPath : localDistPath;

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Centralized Error Handler
app.use(errorHandler);

// Startup Server
const startServer = async () => {
  await connectDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`📜 Phoenix-Scroll Production Engine running on http://localhost:${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}

export default app;
