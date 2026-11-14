import './config/env.js';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health.routes.js';
import { coachRouter } from './routes/coach.routes.js';
import { reportRouter } from './routes/report.routes.js';
import { contentRouter } from './routes/content.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app: Express = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or matching allowedOrigin
      if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local hackathon demo
      }
    },
    credentials: true
  })
);

// Rate limiting: 300 requests per 15 minutes window
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Parse JSON payloads up to 10MB to accommodate downscaled base64 frame samples
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route registrations
app.use('/api/health', healthRouter);
app.use('/api/coach', coachRouter);
app.use('/api/take-report', reportRouter);

// Register content routes at both /api and /api/content for flexibility
app.use('/api', contentRouter);

// Global Error Handler
app.use(errorHandler);

