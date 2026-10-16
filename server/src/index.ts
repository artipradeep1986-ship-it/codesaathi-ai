import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config.js';
import { errorHandler, notFound } from './utils/errors.js';

// Route imports
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import programsRouter from './routes/programs.js';
import executeRouter from './routes/execute.js';
import aiRouter from './routes/ai.js';
import ocrRouter from './routes/ocr.js';
import adminRouter from './routes/admin.js';
import lessonsRouter from './routes/lessons.js';

export const app: Express = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      // Support frontend dev server, configured frontend URL, or localhost variations
      if (
        origin === config.FRONTEND_URL ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      return callback(null, true); // Permissive in dev/staging to avoid blocking students
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsers with 10MB limit (accommodates base64 payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General application rate limiter (e.g., 300 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from this client. Please slow down and try again later.',
    },
  },
});
app.use('/api/', globalLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'CodeSaathi AI Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'CodeSaathi AI Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Route to download CodeSaathi Android APK directly on mobile phone
app.get('/download/apk', (_req: Request, res: Response) => {
  const apkPath = path.resolve('..', 'CodeSaathi-AI.apk');
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'CodeSaathi-AI.apk');
  } else {
    res.status(404).send('APK file not found. Please build the APK first.');
  }
});

// Mount application API route groups
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/programs', programsRouter);
app.use('/api/execute', executeRouter);
app.use('/api/ai', aiRouter);
app.use('/api/ocr', ocrRouter);
app.use('/api/admin', adminRouter);
app.use('/api/lessons', lessonsRouter);

// Catch-all for undefined routes
app.use((req: Request, _res: Response, next) => {
  next(notFound(`Cannot ${req.method} ${req.originalUrl}`));
});

// Global error handler
app.use(errorHandler);

// Start server if not running in test suite
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(config.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 CodeSaathi AI Server running on port ${config.PORT}`);
    console.log(`🌐 Allowed Frontend URL: ${config.FRONTEND_URL}`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

export default app;
