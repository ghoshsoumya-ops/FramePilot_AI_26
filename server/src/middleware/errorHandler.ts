import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/gemini.service.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const safeMessage = GeminiService.sanitizeMessage(err?.message || 'Internal Server Error');
  console.error('[Server Error]', safeMessage);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: safeMessage,
    timestamp: Date.now()
  });
};
