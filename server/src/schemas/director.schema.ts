import { z } from 'zod';

export const DirectorModeSchema = z.enum(['strict', 'flexible', 'coach']);
export type DirectorMode = z.infer<typeof DirectorModeSchema>;

export const LocalEventSchema = z.object({
  type: z.enum([
    'FACE_MISSING',
    'FACE_OFF_CENTER',
    'FACE_TOO_CLOSE',
    'FACE_TOO_FAR',
    'LOW_LIGHT',
    'OVEREXPOSURE',
    'BLUR_DETECTED',
    'AUDIO_LOW',
    'AUDIO_CLIPPING',
    'AUDIO_SILENCE',
    'PACING_TOO_FAST',
    'PACING_TOO_SLOW',
    'FILLER_WORDS',
    'SCRIPT_DRIFT'
  ]),
  timestamp: z.number(),
  message: z.string().optional(),
  details: z.record(z.any()).optional()
});
export type LocalEvent = z.infer<typeof LocalEventSchema>;

export const CoachRequestSchema = z.object({
  mode: DirectorModeSchema.default('flexible'),
  script: z.string().optional().default(''),
  currentSection: z.string().optional().default(''),
  transcript: z.string().optional().default(''),
  localEvents: z.array(LocalEventSchema).optional().default([]),
  metrics: z.object({
    faceDetected: z.boolean().optional(),
    faceFraming: z.string().optional(),
    brightness: z.number().optional(),
    blurScore: z.number().optional(),
    audioLevelRms: z.number().optional(),
    wordsPerMinute: z.number().optional(),
    silenceDurationMs: z.number().optional(),
    fillerCount: z.number().optional()
  }).optional().default({}),
  recentNotes: z.array(z.string()).optional().default([]),
  frames: z.array(z.string()).optional().default([]) // base64 JPEG downscaled
});
export type CoachRequest = z.infer<typeof CoachRequestSchema>;

export const IssueSeveritySchema = z.enum(['critical', 'important', 'polish']);
export type IssueSeverity = z.infer<typeof IssueSeveritySchema>;

export const IssueTypeSchema = z.enum([
  'framing',
  'lighting',
  'audio',
  'script',
  'delivery',
  'pacing',
  'focus'
]);
export type IssueType = z.infer<typeof IssueTypeSchema>;

export const DirectorIssueSchema = z.object({
  type: IssueTypeSchema,
  severity: IssueSeveritySchema,
  message: z.string().max(120),
  action: z.string().max(120)
});
export type DirectorIssue = z.infer<typeof DirectorIssueSchema>;

export const CoachResponseSchema = z.object({
  timestamp: z.number(),
  script_position: z.object({
    section_id: z.string(),
    confidence: z.number().min(0).max(1)
  }),
  issues: z.array(DirectorIssueSchema),
  praise: z.string().nullable().optional(),
  suggest_retake: z.boolean().default(false),
  take_score: z.object({
    delivery: z.number().min(0).max(10),
    technical: z.number().min(0).max(10),
    script_fidelity: z.number().min(0).max(10)
  }),
  isMock: z.boolean().optional()
});
export type CoachResponse = z.infer<typeof CoachResponseSchema>;

export const TakeReportRequestSchema = z.object({
  durationSeconds: z.number().min(0),
  mode: DirectorModeSchema.default('flexible'),
  script: z.string().optional().default(''),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean().default(false)
  })).optional().default([]),
  fullTranscript: z.string().optional().default(''),
  localEvents: z.array(LocalEventSchema).optional().default([]),
  notesGiven: z.array(z.object({
    timestamp: z.number(),
    type: z.string(),
    message: z.string(),
    severity: z.string()
  })).optional().default([]),
  metricsSummary: z.object({
    averageBrightness: z.number().optional().default(50),
    framingIssuesCount: z.number().optional().default(0),
    clippingEventsCount: z.number().optional().default(0),
    silenceEventsCount: z.number().optional().default(0),
    fillerWordCount: z.number().optional().default(0),
    estimatedWpm: z.number().optional().default(130)
  }).optional().default({}),
  keyframeImages: z.array(z.string()).optional().default([]) // base64 JPEG keyframes
});
export type TakeReportRequest = z.infer<typeof TakeReportRequestSchema>;

export const TakeReportResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categoryScores: z.object({
    delivery: z.number().min(0).max(100),
    technical: z.number().min(0).max(100),
    scriptFidelity: z.number().min(0).max(100),
    audioQuality: z.number().min(0).max(100),
    contentStructure: z.number().min(0).max(100)
  }),
  visualAnalysis: z.object({
    lightingQuality: z.string(),
    framingQuality: z.string(),
    facePositioning: z.string(),
    imageSharpness: z.string()
  }),
  audioAnalysis: z.object({
    audioLevel: z.string(),
    clippingEvents: z.number(),
    longPauses: z.number(),
    fillerWords: z.number(),
    speakingPace: z.string()
  }),
  scriptAnalysis: z.object({
    completedSections: z.array(z.string()),
    skippedPoints: z.array(z.string()),
    scriptDriftSummary: z.string(),
    keyMessagesDetected: z.array(z.string())
  }),
  performanceFeedback: z.object({
    strongMoments: z.array(z.string()),
    weakMoments: z.array(z.string()),
    suggestedImprovements: z.array(z.string())
  }),
  retakeRecommendations: z.array(z.object({
    sectionId: z.string(),
    sectionTitle: z.string(),
    reason: z.string(),
    recommended: z.boolean()
  })),
  directorNotesChronological: z.array(z.object({
    timestamp: z.number(),
    type: z.string(),
    message: z.string(),
    severity: z.string()
  })),
  isMock: z.boolean().optional()
});
export type TakeReportResponse = z.infer<typeof TakeReportResponseSchema>;

export const GenerateScriptRequestSchema = z.object({
  topic: z.string().min(2),
  platform: z.enum(['youtube', 'reels', 'shorts', 'general']).default('general'),
  tone: z.enum(['educational', 'conversational', 'professional', 'entertaining']).default('conversational'),
  duration: z.enum(['30s', '60s', '3m', '5m']).default('60s'),
  audience: z.string().optional().default('general creators'),
  objective: z.string().optional().default('')
});
export type GenerateScriptRequest = z.infer<typeof GenerateScriptRequestSchema>;

export const GenerateScriptResponseSchema = z.object({
  title: z.string(),
  hook: z.string(),
  alternativeHooks: z.array(z.string()).min(1),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    estimatedSeconds: z.number()
  })),
  callToAction: z.string(),
  isMock: z.boolean().optional()
});
export type GenerateScriptResponse = z.infer<typeof GenerateScriptResponseSchema>;

export const GenerateHooksRequestSchema = z.object({
  topic: z.string().min(2),
  platform: z.enum(['youtube', 'reels', 'shorts', 'general']).default('general'),
  audience: z.string().optional().default('aspirational creators'),
  existingOpening: z.string().optional().default(''),
  category: z.string().optional().default('education')
});
export type GenerateHooksRequest = z.infer<typeof GenerateHooksRequestSchema>;

export const GenerateHooksResponseSchema = z.object({
  hooks: z.array(z.object({
    hook: z.string(),
    style: z.string(),
    whyItWorks: z.string()
  })).min(3),
  strongerOpeningSentence: z.string(),
  suggestedStructure: z.array(z.string()),
  transitions: z.array(z.string()),
  callToActionSuggestion: z.string(),
  rationale: z.string(),
  isMock: z.boolean().optional()
});
export type GenerateHooksResponse = z.infer<typeof GenerateHooksResponseSchema>;

export const AnalyzeUploadRequestSchema = z.object({
  fileName: z.string().optional().default('uploaded_video.mp4'),
  durationSeconds: z.number().optional().default(60),
  transcript: z.string().optional().default(''),
  frames: z.array(z.string()).max(10).optional().default([]), // downscaled keyframes
  analysisMode: z.enum(['full', 'visual-only', 'transcript-only']).default('full')
});
export type AnalyzeUploadRequest = z.infer<typeof AnalyzeUploadRequestSchema>;

export const AnalyzeUploadResponseSchema = z.object({
  summary: z.string(),
  visualPresentation: z.object({
    framingScore: z.number().min(0).max(10),
    framingNotes: z.string(),
    lightingScore: z.number().min(0).max(10),
    lightingNotes: z.string(),
    stabilityScore: z.number().min(0).max(10),
    stabilityNotes: z.string()
  }),
  contentStructure: z.object({
    hookEvaluation: z.string(),
    pacingNotes: z.string(),
    callToActionEvaluation: z.string()
  }),
  suggestedHooks: z.array(z.string()),
  recommendations: z.array(z.string()),
  isMock: z.boolean().optional()
});
export type AnalyzeUploadResponse = z.infer<typeof AnalyzeUploadResponseSchema>;

