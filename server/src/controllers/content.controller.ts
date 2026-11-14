import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/gemini.service.js';
import {
  GenerateScriptRequest,
  GenerateHooksRequest,
  AnalyzeUploadRequest
} from '../schemas/director.schema.js';

export class ContentController {
  public static async generateScript(
    req: Request<{}, {}, GenerateScriptRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const script = await GeminiService.generateScript(req.body);
      res.json(script);
    } catch (error) {
      next(error);
    }
  }

  public static async generateHooks(
    req: Request<{}, {}, GenerateHooksRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const hooks = await GeminiService.generateHooks(req.body);
      res.json(hooks);
    } catch (error) {
      next(error);
    }
  }

  public static async analyzeUpload(
    req: Request<{}, {}, AnalyzeUploadRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const analysis = await GeminiService.analyzeUpload(req.body);
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }
}

