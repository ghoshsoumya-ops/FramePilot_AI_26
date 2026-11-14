import { Router } from 'express';
import { ContentController } from '../controllers/content.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  GenerateScriptRequestSchema,
  GenerateHooksRequestSchema,
  AnalyzeUploadRequestSchema
} from '../schemas/director.schema.js';

export const contentRouter = Router();

contentRouter.post(
  '/generate-script',
  validateRequest(GenerateScriptRequestSchema),
  ContentController.generateScript
);

contentRouter.post(
  '/generate-hooks',
  validateRequest(GenerateHooksRequestSchema),
  ContentController.generateHooks
);

contentRouter.post(
  '/analyze-upload',
  validateRequest(AnalyzeUploadRequestSchema),
  ContentController.analyzeUpload
);

