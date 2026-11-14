export interface CoachPayload {
  mode: 'strict' | 'flexible' | 'coach';
  script?: string;
  currentSection?: string;
  transcript?: string;
  localEvents?: any[];
  metrics?: {
    faceDetected?: boolean;
    faceFraming?: string;
    brightness?: number;
    blurScore?: number;
    audioLevelRms?: number;
    wordsPerMinute?: number;
    silenceDurationMs?: number;
    fillerCount?: number;
  };
  recentNotes?: string[];
  frames?: string[]; // downscaled base64 JPEGs (only if consented)
}

export interface TakeReportPayload {
  durationSeconds: number;
  mode: 'strict' | 'flexible' | 'coach';
  script?: string;
  sections?: Array<{ id: string; title: string; completed: boolean }>;
  fullTranscript?: string;
  localEvents?: any[];
  notesGiven?: Array<{ timestamp: number; type: string; message: string; severity: string }>;
  metricsSummary?: {
    averageBrightness?: number;
    framingIssuesCount?: number;
    clippingEventsCount?: number;
    silenceEventsCount?: number;
    fillerWordCount?: number;
    estimatedWpm?: number;
  };
  keyframeImages?: string[];
}

export interface GenerateScriptPayload {
  topic: string;
  platform: 'youtube' | 'reels' | 'shorts' | 'general';
  tone: 'educational' | 'conversational' | 'professional' | 'entertaining';
  duration: '30s' | '60s' | '3m' | '5m';
  audience?: string;
  objective?: string;
}

export interface GenerateHooksPayload {
  topic: string;
  platform: 'youtube' | 'reels' | 'shorts' | 'general';
  audience?: string;
  existingOpening?: string;
  category?: string;
}

export interface AnalyzeUploadPayload {
  fileName?: string;
  durationSeconds?: number;
  transcript?: string;
  frames?: string[];
  analysisMode?: 'full' | 'visual-only' | 'transcript-only';
}

const API_BASE = '/api';

export class ApiService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!res.ok) {
      let errorMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch {
        // ignore fallback
      }
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  }

  public static async getHealth(): Promise<{
    status: string;
    service: string;
    mockMode: boolean;
    models: any;
  }> {
    return this.request('/health', { method: 'GET' });
  }

  public static async getCoachFeedback(payload: CoachPayload, signal?: AbortSignal): Promise<any> {
    return this.request('/coach', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal
    });
  }

  public static async getTakeReport(payload: TakeReportPayload): Promise<any> {
    return this.request('/take-report', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async generateScript(payload: GenerateScriptPayload): Promise<any> {
    return this.request('/generate-script', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async generateHooks(payload: GenerateHooksPayload): Promise<any> {
    return this.request('/generate-hooks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async analyzeUpload(payload: AnalyzeUploadPayload): Promise<any> {
    return this.request('/analyze-upload', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

