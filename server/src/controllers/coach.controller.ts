import { Request, Response, NextFunction } from 'express';
import { DirectorService } from '../services/director.service.js';
import { CoachRequest } from '../schemas/director.schema.js';

export class CoachController {
  public static async getFeedback(
    req: Request<{}, {}, CoachRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const feedback = await DirectorService.processCoachTick(req.body);
      res.json(feedback);
    } catch (error) {
      next(error);
    }
  }
}

