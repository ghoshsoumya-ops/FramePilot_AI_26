import { Router, Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'FramePilot AI Backend Engine',
    timestamp: Date.now(),
    mockMode: GeminiService.isMockMode(),
    models: {
      live: GeminiService.getLiveModel(),
      report: GeminiService.getReportModel(),
      content: GeminiService.getContentModel()
    }
  });
});
