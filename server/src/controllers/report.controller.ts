import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/gemini.service.js';
import { TakeReportRequest } from '../schemas/director.schema.js';

export class ReportController {
  public static async generateReport(
    req: Request<{}, {}, TakeReportRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const report = await GeminiService.getTakeReport(req.body);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}

