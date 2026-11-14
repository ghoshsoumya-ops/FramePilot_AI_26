import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { TakeReportRequestSchema } from '../schemas/director.schema.js';

export const reportRouter = Router();

reportRouter.post('/', validateRequest(TakeReportRequestSchema), ReportController.generateReport);

