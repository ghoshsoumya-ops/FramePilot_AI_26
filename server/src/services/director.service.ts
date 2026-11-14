import { CoachRequest, CoachResponse } from '../schemas/director.schema.js';
import { GeminiService } from './gemini.service.js';

export class DirectorService {
  /**
   * Process incoming recording coaching tick
   */
  public static async processCoachTick(req: CoachRequest): Promise<CoachResponse> {
    const feedback = await GeminiService.getLiveCoachFeedback(req);

    // If issues are returned, ensure severity ordering: critical -> important -> polish
    if (feedback.issues && feedback.issues.length > 1) {
      const severityRank: Record<string, number> = {
        critical: 3,
        important: 2,
        polish: 1
      };
      feedback.issues.sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));
    }

    return feedback;
  }
}

