import { Router } from 'express';
import { CoachController } from '../controllers/coach.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { CoachRequestSchema } from '../schemas/director.schema.js';

export const coachRouter = Router();

coachRouter.post('/', validateRequest(CoachRequestSchema), CoachController.getFeedback);

