import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  extractTokens,
  parseScript,
  calculateTokenOverlap,
  matchTranscriptToScript
} from '../client/src/utils/scriptMatcher.js';

describe('scriptMatcher Utility', () => {
  it('normalizes text by removing punctuation and extra whitespace', () => {
    const raw = '  Hello, World! This is a TEST... with    spaces.  ';
    expect(normalizeText(raw)).toBe('hello world this is a test with spaces');
  });

  it('extracts significant tokens ignoring stop words', () => {
    const text = 'Welcome to this video tutorial on advanced coding';
    const tokens = extractTokens(text);
    expect(tokens).toContain('welcome');
    expect(tokens).toContain('video');
    expect(tokens).toContain('tutorial');
    expect(tokens).toContain('advanced');
    expect(tokens).toContain('coding');
    expect(tokens).not.toContain('to');
    expect(tokens).not.toContain('this');
    expect(tokens).not.toContain('on');
  });

  it('parses markdown headers into distinct script sections', () => {
    const script = `
# Hook
Stop scrolling right now.

# Introduction
Welcome back to the channel.

# Main Point 1
Here is the first key technique.
    `.trim();

    const sections = parseScript(script);
    expect(sections.length).toBe(3);
    expect(sections[0].title).toBe('Hook');
    expect(sections[0].content).toContain('Stop scrolling');
    expect(sections[1].title).toBe('Introduction');
    expect(sections[2].title).toBe('Main Point 1');
  });

  it('calculates token overlap correctly', () => {
    const tokensA = ['creator', 'video', 'retention', 'pacing'];
    const tokensB = ['video', 'pacing', 'camera', 'lighting'];
    const overlap = calculateTokenOverlap(tokensA, tokensB);
    expect(overlap).toBe(0.5); // 2 out of 4
  });

  it('matches transcript against script and marks completion when threshold is reached', () => {
    const sections = [
      {
        id: 'sec-1',
        title: 'Hook',
        content: 'Stop scrolling and listen to this fundamental creator advice',
        expectedKeywords: ['scrolling', 'listen', 'fundamental', 'creator', 'advice'],
        completed: false,
        progress: 0
      }
    ];

    const spoken = 'Hey everyone stop scrolling and listen to this fundamental creator advice today';
    const result = matchTranscriptToScript(spoken, sections, 0, 'flexible');

    expect(result.currentSectionId).toBe('sec-1');
    expect(sections[0].completed).toBe(true);
    expect(result.overallProgress).toBeGreaterThanOrEqual(0.45);
  });

  it('detects script drift when speaker rambles off topic', () => {
    const sections = [
      {
        id: 'sec-1',
        title: 'Technical Setup',
        content: 'Configure your microphone gain and aperture settings carefully',
        expectedKeywords: ['configure', 'microphone', 'gain', 'aperture', 'settings', 'carefully'],
        completed: false,
        progress: 0
      }
    ];

    const unrelatedSpoken = 'So yesterday I went to the supermarket and bought some groceries and apples and bananas and then walked my dog around the park for an hour';
    const result = matchTranscriptToScript(unrelatedSpoken, sections, 0, 'strict');

    expect(result.isDrifting).toBe(true);
    expect(result.driftConfidence).toBeGreaterThan(0.5);
  });
});

