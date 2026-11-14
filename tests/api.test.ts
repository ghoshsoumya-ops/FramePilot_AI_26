import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';

describe('FramePilot Backend API Endpoints', () => {
  it('GET /api/health returns healthy service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('FramePilot');
    expect(res.body.mockMode).toBe(false);
  });

  it('POST /api/coach returns valid director feedback', async () => {
    const payload = {
      mode: 'strict',
      script: '# Intro\nWelcome creators to the live studio.',
      currentSection: 'Intro',
      transcript: 'Welcome creators to the studio today',
      localEvents: [
        {
          type: 'LOW_LIGHT',
          timestamp: Date.now(),
          message: 'Underexposed face'
        }
      ],
      metrics: {
        faceDetected: true,
        brightness: 45,
        audioLevelRms: 0.15,
        wordsPerMinute: 130
      },
      recentNotes: [],
      frames: []
    };

    const res = await request(app).post('/api/coach').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('script_position');
    expect(res.body).toHaveProperty('issues');
    expect(Array.isArray(res.body.issues)).toBe(true);
    expect(res.body.take_score).toHaveProperty('delivery');
    expect(res.body.isMock).toBe(false);
  });

  it('POST /api/coach rejects invalid payload with 400 validation error', async () => {
    const invalidPayload = {
      mode: 'invalid-mode', // invalid enum
      localEvents: 'not-an-array'
    };

    const res = await request(app).post('/api/coach').send(invalidPayload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Validation Error');
  });

  it('POST /api/take-report returns comprehensive report', async () => {
    const payload = {
      durationSeconds: 90,
      mode: 'flexible',
      script: '# Hook\nHook text\n# Intro\nIntro text',
      sections: [
        { id: 'sec-1', title: 'Hook', completed: true },
        { id: 'sec-2', title: 'Intro', completed: true }
      ],
      fullTranscript: 'Hook text was spoken followed by intro text.',
      localEvents: [],
      notesGiven: [],
      metricsSummary: {
        averageBrightness: 120,
        framingIssuesCount: 0,
        clippingEventsCount: 0,
        silenceEventsCount: 1,
        fillerWordCount: 2,
        estimatedWpm: 135
      }
    };

    const res = await request(app).post('/api/take-report').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.overallScore).toBeGreaterThanOrEqual(0);
    expect(res.body.overallScore).toBeLessThanOrEqual(100);
    expect(res.body).toHaveProperty('categoryScores');
    expect(res.body).toHaveProperty('visualAnalysis');
    expect(res.body).toHaveProperty('audioAnalysis');
    expect(res.body).toHaveProperty('performanceFeedback');
    expect(res.body.isMock).toBe(false);
  });

  it('POST /api/generate-script generates structured script sections', async () => {
    const payload = {
      topic: 'How to practice coding daily',
      platform: 'youtube',
      tone: 'conversational',
      duration: '60s'
    };

    const res = await request(app).post('/api/generate-script').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('hook');
    expect(res.body.alternativeHooks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.sections.length).toBeGreaterThanOrEqual(2);
    expect(res.body.isMock).toBe(false);
  });

  it('POST /api/generate-hooks returns engineered alternative hooks', async () => {
    const payload = {
      topic: 'Building habits in 2026',
      platform: 'reels',
      audience: 'Students',
      category: 'Education',
      existingOpening: 'Today I will discuss habits.'
    };

    const res = await request(app).post('/api/generate-hooks').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.hooks.length).toBeGreaterThanOrEqual(3);
    expect(res.body).toHaveProperty('strongerOpeningSentence');
    expect(res.body).toHaveProperty('suggestedStructure');
    expect(res.body).toHaveProperty('transitions');
    expect(res.body.isMock).toBe(false);
  });

  it('POST /api/analyze-upload evaluates video metadata', async () => {
    const payload = {
      fileName: 'test-take.mp4',
      durationSeconds: 45,
      transcript: 'Here is the spoken content from the video file.',
      frames: [],
      analysisMode: 'full'
    };

    const res = await request(app).post('/api/analyze-upload').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('visualPresentation');
    expect(res.body).toHaveProperty('contentStructure');
    expect(res.body).toHaveProperty('suggestedHooks');
    expect(res.body.isMock).toBe(false);
  });
});

