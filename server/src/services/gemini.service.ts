import '../config/env.js';
import {
  CoachRequest,
  CoachResponse,
  CoachResponseSchema,
  TakeReportRequest,
  TakeReportResponse,
  TakeReportResponseSchema,
  GenerateScriptRequest,
  GenerateScriptResponse,
  GenerateScriptResponseSchema,
  GenerateHooksRequest,
  GenerateHooksResponse,
  GenerateHooksResponseSchema,
  AnalyzeUploadRequest,
  AnalyzeUploadResponse,
  AnalyzeUploadResponseSchema
} from '../schemas/director.schema.js';
import { DIRECTOR_SYSTEM_PROMPT } from '../prompts/director.system.js';
import { REPORT_SYSTEM_PROMPT } from '../prompts/report.system.js';
import { SCRIPT_GEN_SYSTEM_PROMPT, HOOKS_GEN_SYSTEM_PROMPT } from '../prompts/content.system.js';
import { MockService } from './mock.service.js';

export class GeminiService {
  public static getApiKey(): string {
    return (process.env.GEMINI_API_KEY || '').trim();
  }

  public static getLiveModel(): string {
    return (process.env.GEMINI_LIVE_MODEL || 'gemini-3.5-flash-lite').trim();
  }

  public static getReportModel(): string {
    return (process.env.GEMINI_REPORT_MODEL || 'gemini-3.5-flash').trim();
  }

  public static getContentModel(): string {
    return (process.env.GEMINI_CONTENT_MODEL || 'gemini-3.5-flash').trim();
  }

  public static isMockMode(): boolean {
    return process.env.MOCK_LLM === 'true';
  }

  /**
   * Helper to redact and sanitize any sensitive API keys from strings or errors
   */
  public static sanitizeMessage(raw: any): string {
    let msg = typeof raw === 'string' ? raw : raw?.message || JSON.stringify(raw);
    const key = this.getApiKey();
    if (key && key.length > 5) {
      msg = msg.split(key).join('[REDACTED_API_KEY]');
    }
    // Also redact standard Google API key patterns
    msg = msg.replace(/(?:key=)([^&\s"']+)/gi, 'key=[REDACTED_API_KEY]');
    msg = msg.replace(/AIza[0-9A-Za-z_-]{35}/g, '[REDACTED_API_KEY]');
    msg = msg.replace(/AQ\.[A-Za-z0-9_-]{40,}/g, '[REDACTED_API_KEY]');
    return msg;
  }

  /**
   * Formats raw errors into clear, user-friendly messages for the client
   */
  public static formatUserFacingError(err: any): Error {
    const rawMsg = err?.message || String(err);
    const sanitized = this.sanitizeMessage(rawMsg);
    const status = err?.status || err?.statusCode || (rawMsg.includes('404') ? 404 : rawMsg.includes('503') ? 503 : rawMsg.includes('429') ? 429 : 500);

    let friendlyMessage = 'Gemini AI service encountered an error. Please try again.';

    if (!this.getApiKey()) {
      friendlyMessage = 'GEMINI_API_KEY is not configured in the environment file. Please set GEMINI_API_KEY in .env.';
    } else if (status === 401 || status === 403 || rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('PERMISSION_DENIED')) {
      friendlyMessage = 'Gemini API authentication failed: Invalid or unauthorized GEMINI_API_KEY.';
    } else if (status === 404 || rawMsg.includes('NOT_FOUND') || rawMsg.includes('no longer available')) {
      friendlyMessage = 'The configured Gemini AI model was not found or is no longer available. Please update model IDs in .env.';
    } else if (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      friendlyMessage = 'Gemini API rate limit exceeded. Please wait a few moments before trying again.';
    } else if (status === 503 || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('high demand')) {
      friendlyMessage = 'Gemini AI service is temporarily experiencing high demand. Please try again in a few seconds.';
    } else if (rawMsg.includes('timeout') || rawMsg.includes('timed out') || rawMsg.includes('ETIMEDOUT') || rawMsg.includes('AbortError')) {
      friendlyMessage = 'Gemini API request timed out. Please check your network connection and try again.';
    } else if (rawMsg.includes('fetch failed') || rawMsg.includes('ECONNREFUSED') || rawMsg.includes('ENOTFOUND')) {
      friendlyMessage = 'Unable to connect to Google Gemini API servers. Please check your internet connectivity.';
    } else if (rawMsg.includes('JSON') || rawMsg.includes('Unexpected token')) {
      friendlyMessage = 'Gemini AI returned a malformed response format. Please try again.';
    }

    const appError: any = new Error(friendlyMessage);
    appError.status = status;
    appError.originalMessage = sanitized;
    return appError;
  }

  /**
   * Helper to clean JSON strings potentially wrapped in markdown code blocks
   */
  private static cleanJsonString(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith('```json')) {
      return trimmed.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    }
    if (trimmed.startsWith('```')) {
      return trimmed.replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    }
    return trimmed;
  }

  /**
   * Safe execution wrapper for Google GenAI calls with resilient model fallback, retry, and timeout
   */
  private static async executeGenAi(
    preferredModel: string,
    systemPrompt: string,
    userPrompt: string,
    inlineImages: string[] = []
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment file.');
    }

    // Build candidate model list starting with preferredModel
    const fallbackCandidates = [
      preferredModel,
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.7-flash'
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    // Dynamic import to support ESM
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    // Construct parts array
    const parts: any[] = [{ text: `${systemPrompt}\n\nUSER REQUEST & CONTEXT:\n${userPrompt}` }];

    // Attach downscaled base64 images if provided (remove data:image/jpeg;base64, prefix if present)
    for (const img of inlineImages) {
      if (!img) continue;
      const cleanBase64 = img.includes(',') ? img.split(',')[1] : img;
      if (!cleanBase64.trim()) continue;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64.trim()
        }
      });
    }

    let lastError: any = null;

    for (const model of fallbackCandidates) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`API request timed out (25s) on ${model}`)), 25000)
          );

          const generatePromise = ai.models.generateContent({
            model,
            contents: parts,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2
            }
          });

          const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
          const text = response?.text || '';
          if (!text.trim()) {
            throw new Error('Empty response received from Gemini model.');
          }
          return this.cleanJsonString(text);
        } catch (err: any) {
          lastError = err;
          const sanitizedErr = this.sanitizeMessage(err?.message || err);
          console.warn(`[GeminiService] Model ${model} (attempt ${attempt}) failed: ${sanitizedErr}.`);

          // If auth error or missing key, fail immediately without trying fallbacks
          if (err?.status === 401 || err?.status === 403 || (typeof sanitizedErr === 'string' && sanitizedErr.includes('API_KEY_INVALID'))) {
            throw this.formatUserFacingError(err);
          }

          if (attempt === 1) {
            // Short backoff before second attempt on same model
            await new Promise(r => setTimeout(r, 600));
          }
        }
      }
    }

    console.error(`[GeminiService Error] All Gemini candidate models failed. Last error: ${this.sanitizeMessage(lastError?.message || lastError)}`);
    throw this.formatUserFacingError(lastError);
  }

  /**
   * Real-time live coaching feedback
   */
  public static async getLiveCoachFeedback(req: CoachRequest): Promise<CoachResponse> {
    if (this.isMockMode()) {
      return MockService.getCoachFeedback(req);
    }

    const userPrompt = JSON.stringify({
      mode: req.mode,
      script: req.script,
      currentSection: req.currentSection,
      transcript: req.transcript,
      localEvents: req.localEvents,
      metrics: req.metrics,
      recentNotes: req.recentNotes,
      frameCount: req.frames?.length || 0
    });

    try {
      const jsonText = await this.executeGenAi(
        this.getLiveModel(),
        DIRECTOR_SYSTEM_PROMPT,
        userPrompt,
        req.frames
      );
      const parsed = JSON.parse(jsonText);

      const normalized = {
        timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
        script_position: {
          section_id: String(parsed.script_position?.section_id || req.currentSection || 'Intro'),
          confidence: Math.max(0, Math.min(1, Number(parsed.script_position?.confidence ?? 0.85)))
        },
        issues: Array.isArray(parsed.issues)
          ? parsed.issues.map((iss: any) => ({
              type: ['framing', 'lighting', 'audio', 'script', 'delivery', 'pacing', 'focus'].includes(iss?.type)
                ? iss.type
                : 'delivery',
              severity: ['critical', 'important', 'polish'].includes(iss?.severity)
                ? iss.severity
                : 'important',
              message: String(iss?.message || 'Director note').slice(0, 120),
              action: String(iss?.action || 'Adjust delivery').slice(0, 120)
            }))
          : [],
        praise: parsed.praise ? String(parsed.praise) : null,
        suggest_retake: Boolean(parsed.suggest_retake),
        take_score: {
          delivery: Math.max(0, Math.min(10, Number(parsed.take_score?.delivery ?? 8))),
          technical: Math.max(0, Math.min(10, Number(parsed.take_score?.technical ?? 8))),
          script_fidelity: Math.max(0, Math.min(10, Number(parsed.take_score?.script_fidelity ?? 8)))
        },
        isMock: false
      };

      return CoachResponseSchema.parse(normalized);
    } catch (err: any) {
      console.error(`[GeminiService Error] /api/coach failed: ${this.sanitizeMessage(err?.message || err)}`);
      throw this.formatUserFacingError(err);
    }
  }

  /**
   * Post-take comprehensive review report
   */
  public static async getTakeReport(req: TakeReportRequest): Promise<TakeReportResponse> {
    if (this.isMockMode()) {
      return MockService.getTakeReport(req);
    }

    const userPrompt = JSON.stringify({
      durationSeconds: req.durationSeconds,
      mode: req.mode,
      script: req.script,
      sections: req.sections,
      fullTranscript: req.fullTranscript,
      localEvents: req.localEvents,
      notesGiven: req.notesGiven,
      metricsSummary: req.metricsSummary,
      keyframeCount: req.keyframeImages?.length || 0
    });

    try {
      const jsonText = await this.executeGenAi(
        this.getReportModel(),
        REPORT_SYSTEM_PROMPT,
        userPrompt,
        req.keyframeImages
      );
      const parsed = JSON.parse(jsonText);

      const normalized = {
        overallScore: Math.max(0, Math.min(100, Number(parsed.overallScore ?? 80))),
        categoryScores: {
          delivery: Math.max(0, Math.min(100, Number(parsed.categoryScores?.delivery ?? 80))),
          technical: Math.max(0, Math.min(100, Number(parsed.categoryScores?.technical ?? 80))),
          scriptFidelity: Math.max(0, Math.min(100, Number(parsed.categoryScores?.scriptFidelity ?? 80))),
          audioQuality: Math.max(0, Math.min(100, Number(parsed.categoryScores?.audioQuality ?? 80))),
          contentStructure: Math.max(0, Math.min(100, Number(parsed.categoryScores?.contentStructure ?? 80)))
        },
        visualAnalysis: {
          lightingQuality: String(parsed.visualAnalysis?.lightingQuality || 'Good lighting detected'),
          framingQuality: String(parsed.visualAnalysis?.framingQuality || 'Proper framing'),
          facePositioning: String(parsed.visualAnalysis?.facePositioning || 'Face centered'),
          imageSharpness: String(parsed.visualAnalysis?.imageSharpness || 'Sharp clarity')
        },
        audioAnalysis: {
          audioLevel: String(parsed.audioAnalysis?.audioLevel || 'Clear audio volume'),
          clippingEvents: Number(parsed.audioAnalysis?.clippingEvents ?? req.metricsSummary?.clippingEventsCount ?? 0),
          longPauses: Number(parsed.audioAnalysis?.longPauses ?? req.metricsSummary?.silenceEventsCount ?? 0),
          fillerWords: Number(parsed.audioAnalysis?.fillerWords ?? req.metricsSummary?.fillerWordCount ?? 0),
          speakingPace: String(parsed.audioAnalysis?.speakingPace || `${req.metricsSummary?.estimatedWpm || 135} WPM`)
        },
        scriptAnalysis: {
          completedSections: Array.isArray(parsed.scriptAnalysis?.completedSections)
            ? parsed.scriptAnalysis.completedSections.map(String)
            : [],
          skippedPoints: Array.isArray(parsed.scriptAnalysis?.skippedPoints)
            ? parsed.scriptAnalysis.skippedPoints.map(String)
            : [],
          scriptDriftSummary: String(parsed.scriptAnalysis?.scriptDriftSummary || 'Good script fidelity'),
          keyMessagesDetected: Array.isArray(parsed.scriptAnalysis?.keyMessagesDetected)
            ? parsed.scriptAnalysis.keyMessagesDetected.map(String)
            : []
        },
        performanceFeedback: {
          strongMoments: Array.isArray(parsed.performanceFeedback?.strongMoments) && parsed.performanceFeedback.strongMoments.length > 0
            ? parsed.performanceFeedback.strongMoments.map(String)
            : ['Solid confident presentation throughout'],
          weakMoments: Array.isArray(parsed.performanceFeedback?.weakMoments)
            ? parsed.performanceFeedback.weakMoments.map(String)
            : [],
          suggestedImprovements: Array.isArray(parsed.performanceFeedback?.suggestedImprovements)
            ? parsed.performanceFeedback.suggestedImprovements.map(String)
            : []
        },
        retakeRecommendations: Array.isArray(parsed.retakeRecommendations)
          ? parsed.retakeRecommendations.map((r: any) => ({
              sectionId: String(r?.sectionId || 'section-1'),
              sectionTitle: String(r?.sectionTitle || 'Section'),
              reason: String(r?.reason || 'Recommended polish'),
              recommended: Boolean(r?.recommended)
            }))
          : [],
        directorNotesChronological: Array.isArray(parsed.directorNotesChronological)
          ? parsed.directorNotesChronological.map((n: any) => ({
              timestamp: Number(n?.timestamp ?? Date.now()),
              type: String(n?.type || 'general'),
              message: String(n?.message || ''),
              severity: String(n?.severity || 'polish')
            }))
          : (req.notesGiven || []),
        isMock: false
      };

      return TakeReportResponseSchema.parse(normalized);
    } catch (err: any) {
      console.error(`[GeminiService Error] /api/take-report failed: ${this.sanitizeMessage(err?.message || err)}`);
      throw this.formatUserFacingError(err);
    }
  }

  /**
   * Generate video script
   */
  public static async generateScript(req: GenerateScriptRequest): Promise<GenerateScriptResponse> {
    if (this.isMockMode()) {
      return MockService.generateScript(req);
    }

    const userPrompt = JSON.stringify(req);

    try {
      const jsonText = await this.executeGenAi(
        this.getContentModel(),
        SCRIPT_GEN_SYSTEM_PROMPT,
        userPrompt
      );
      const parsed = JSON.parse(jsonText);

      const normalized = {
        title: String(parsed.title || req.topic),
        hook: String(parsed.hook || 'Opening Hook'),
        alternativeHooks: Array.isArray(parsed.alternativeHooks) && parsed.alternativeHooks.length > 0
          ? parsed.alternativeHooks.map(String)
          : [String(parsed.hook || 'Alternative Opening Hook')],
        sections: Array.isArray(parsed.sections) && parsed.sections.length > 0
          ? parsed.sections.map((s: any, idx: number) => ({
              id: String(s?.id || `section-${idx + 1}`),
              title: String(s?.title || `Section ${idx + 1}`),
              content: String(s?.content || ''),
              estimatedSeconds: Number(s?.estimatedSeconds || 15)
            }))
          : [
              { id: 'hook', title: 'Hook', content: String(parsed.hook || 'Welcome'), estimatedSeconds: 10 },
              { id: 'main', title: 'Main Point', content: 'Key takeaways and insights...', estimatedSeconds: 30 }
            ],
        callToAction: String(parsed.callToAction || 'Like, comment and follow for more!'),
        isMock: false
      };

      return GenerateScriptResponseSchema.parse(normalized);
    } catch (err: any) {
      console.error(`[GeminiService Error] /api/generate-script failed: ${this.sanitizeMessage(err?.message || err)}`);
      throw this.formatUserFacingError(err);
    }
  }

  /**
   * Generate alternative viral hooks
   */
  public static async generateHooks(req: GenerateHooksRequest): Promise<GenerateHooksResponse> {
    if (this.isMockMode()) {
      return MockService.generateHooks(req);
    }

    const userPrompt = JSON.stringify(req);

    try {
      const jsonText = await this.executeGenAi(
        this.getContentModel(),
        HOOKS_GEN_SYSTEM_PROMPT,
        userPrompt
      );
      const parsed = JSON.parse(jsonText);

      const rawHooks = Array.isArray(parsed.hooks)
        ? parsed.hooks.map((h: any) => ({
            hook: String(h?.hook || ''),
            style: String(h?.style || 'Curiosity Gap'),
            whyItWorks: String(h?.whyItWorks || 'Creates immediate viewer intrigue')
          }))
        : [];

      const fallbackHooks = [
        { hook: 'The one mistake stopping your progress right now.', style: 'Curiosity Gap', whyItWorks: 'Direct call to common fear' },
        { hook: 'Stop doing this if you want real results this year.', style: 'Contrarian', whyItWorks: 'Pattern interrupt' },
        { hook: 'Here is what nobody tells you about getting ahead.', style: 'Bold Claim', whyItWorks: 'Insider secret positioning' }
      ];

      const mergedHooks = rawHooks.length >= 3 ? rawHooks : [...rawHooks, ...fallbackHooks].slice(0, 3);

      const normalized = {
        hooks: mergedHooks,
        strongerOpeningSentence: String(parsed.strongerOpeningSentence || req.existingOpening || 'Here is what changes everything:'),
        suggestedStructure: Array.isArray(parsed.suggestedStructure) && parsed.suggestedStructure.length > 0
          ? parsed.suggestedStructure.map(String)
          : ['Beat 1: The Disruption', 'Beat 2: The Core Insight', 'Beat 3: The Framework'],
        transitions: Array.isArray(parsed.transitions) && parsed.transitions.length > 0
          ? parsed.transitions.map(String)
          : ['Now let us break this down:', 'Here is where it gets interesting:'],
        callToActionSuggestion: String(parsed.callToActionSuggestion || 'Drop a comment with your favorite take!'),
        rationale: String(parsed.rationale || 'Engineered for viewer retention and emotional resonance.'),
        isMock: false
      };

      return GenerateHooksResponseSchema.parse(normalized);
    } catch (err: any) {
      console.error(`[GeminiService Error] /api/generate-hooks failed: ${this.sanitizeMessage(err?.message || err)}`);
      throw this.formatUserFacingError(err);
    }
  }

  /**
   * Analyze uploaded video file
   */
  public static async analyzeUpload(req: AnalyzeUploadRequest): Promise<AnalyzeUploadResponse> {
    if (this.isMockMode()) {
      return MockService.analyzeUpload(req);
    }

    const userPrompt = JSON.stringify({
      fileName: req.fileName,
      durationSeconds: req.durationSeconds,
      transcript: req.transcript,
      analysisMode: req.analysisMode,
      frameCount: req.frames?.length || 0
    });

    const systemPrompt = `
You are the Video Upload Analysis Specialist of FramePilot AI.
Analyze the video based on the provided frames and transcript.
Return a structured JSON object matching:
{
  "summary": "string overview",
  "visualPresentation": {
    "framingScore": number 0-10,
    "framingNotes": "string notes",
    "lightingScore": number 0-10,
    "lightingNotes": "string notes",
    "stabilityScore": number 0-10,
    "stabilityNotes": "string notes"
  },
  "contentStructure": {
    "hookEvaluation": "string notes",
    "pacingNotes": "string notes",
    "callToActionEvaluation": "string notes"
  },
  "suggestedHooks": ["hook 1", "hook 2", "hook 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}
`;

    try {
      const jsonText = await this.executeGenAi(
        this.getContentModel(),
        systemPrompt,
        userPrompt,
        req.frames
      );
      const parsed = JSON.parse(jsonText);

      const normalized = {
        summary: String(parsed.summary || 'Video review analysis completed.'),
        visualPresentation: {
          framingScore: Math.max(0, Math.min(10, Number(parsed.visualPresentation?.framingScore ?? 8))),
          framingNotes: String(parsed.visualPresentation?.framingNotes || 'Subject positioned well within frame.'),
          lightingScore: Math.max(0, Math.min(10, Number(parsed.visualPresentation?.lightingScore ?? 8))),
          lightingNotes: String(parsed.visualPresentation?.lightingNotes || 'Luminance is balanced.'),
          stabilityScore: Math.max(0, Math.min(10, Number(parsed.visualPresentation?.stabilityScore ?? 8))),
          stabilityNotes: String(parsed.visualPresentation?.stabilityNotes || 'Camera position is stable.')
        },
        contentStructure: {
          hookEvaluation: String(parsed.contentStructure?.hookEvaluation || 'Hook introduces topic promptly.'),
          pacingNotes: String(parsed.contentStructure?.pacingNotes || 'Consistent pacing maintained.'),
          callToActionEvaluation: String(parsed.contentStructure?.callToActionEvaluation || 'Call to action clearly stated.')
        },
        suggestedHooks: Array.isArray(parsed.suggestedHooks) && parsed.suggestedHooks.length > 0
          ? parsed.suggestedHooks.map(String)
          : ['Strong opening hook', 'Contrarian opening', 'Curiosity hook'],
        recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
          ? parsed.recommendations.map(String)
          : ['Maintain high eye-level energy', 'Add visual punch-ins on key points'],
        isMock: false
      };

      return AnalyzeUploadResponseSchema.parse(normalized);
    } catch (err: any) {
      console.error(`[GeminiService Error] /api/analyze-upload failed: ${this.sanitizeMessage(err?.message || err)}`);
      throw this.formatUserFacingError(err);
    }
  }
}
