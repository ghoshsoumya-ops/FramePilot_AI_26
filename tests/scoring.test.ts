import { describe, it, expect } from 'vitest';
import { calculatePerformanceScores } from '../client/src/utils/scoring.js';

describe('calculatePerformanceScores Utility', () => {
  it('returns high score for flawless take execution', () => {
    const perfectTake = {
      durationSeconds: 120,
      framingIssuesCount: 0,
      lightingIssuesCount: 0,
      blurEventsCount: 0,
      audioClippingCount: 0,
      silenceCount: 1,
      fillerWordsCount: 1,
      estimatedWpm: 135,
      totalSections: 4,
      completedSections: 4,
      scriptDriftCount: 0
    };

    const scores = calculatePerformanceScores(perfectTake);
    expect(scores.overall).toBeGreaterThanOrEqual(90);
    expect(scores.technical).toBe(100);
    expect(scores.audioQuality).toBe(100);
    expect(scores.scriptFidelity).toBe(100);
  });

  it('applies penalties for technical glitches and audio clipping', () => {
    const flawedTake = {
      durationSeconds: 60,
      framingIssuesCount: 3,
      lightingIssuesCount: 2,
      blurEventsCount: 1,
      audioClippingCount: 2,
      silenceCount: 5,
      fillerWordsCount: 8,
      estimatedWpm: 190, // rushed
      totalSections: 4,
      completedSections: 2, // half completed
      scriptDriftCount: 1
    };

    const scores = calculatePerformanceScores(flawedTake);
    expect(scores.overall).toBeLessThan(75);
    expect(scores.technical).toBeLessThan(80);
    expect(scores.audioQuality).toBeLessThan(80);
    expect(scores.delivery).toBeLessThan(80);
    expect(scores.scriptFidelity).toBeLessThan(60);

    expect(scores.breakdown.technicalDeductions.length).toBeGreaterThan(0);
    expect(scores.breakdown.audioDeductions.length).toBeGreaterThan(0);
    expect(scores.breakdown.deliveryDeductions.length).toBeGreaterThan(0);
  });

  it('clamps scores within transparent 0 to 100 boundaries', () => {
    const extremeTake = {
      durationSeconds: 5, // very short
      framingIssuesCount: 20,
      lightingIssuesCount: 15,
      blurEventsCount: 10,
      audioClippingCount: 15,
      silenceCount: 20,
      fillerWordsCount: 30,
      estimatedWpm: 250,
      totalSections: 5,
      completedSections: 0,
      scriptDriftCount: 10
    };

    const scores = calculatePerformanceScores(extremeTake);
    expect(scores.overall).toBeGreaterThanOrEqual(0);
    expect(scores.overall).toBeLessThanOrEqual(100);
    expect(scores.technical).toBeGreaterThanOrEqual(0);
    expect(scores.delivery).toBeGreaterThanOrEqual(0);
  });
});

