import { describe, it, expect, beforeEach } from 'vitest';
import { DirectorNoteThrottler } from '../client/src/utils/noteThrottler.js';

describe('DirectorNoteThrottler Utility', () => {
  let throttler: DirectorNoteThrottler;

  beforeEach(() => {
    throttler = new DirectorNoteThrottler({
      cooldownMsPerType: 5000,
      duplicateMessageCooldownMs: 10000,
      maxWords: 10
    });
  });

  it('ranks severity weight correctly', () => {
    expect(DirectorNoteThrottler.getSeverityWeight('critical')).toBe(3);
    expect(DirectorNoteThrottler.getSeverityWeight('important')).toBe(2);
    expect(DirectorNoteThrottler.getSeverityWeight('polish')).toBe(1);
  });

  it('truncates messages exceeding maxWords', () => {
    const longMsg = 'One two three four five six seven eight nine ten eleven twelve thirteen';
    const note = throttler.evaluateCandidate({
      type: 'lighting',
      severity: 'important',
      message: longMsg
    }, 1000);

    expect(note).not.toBeNull();
    expect(note?.message.endsWith('...')).toBe(true);
    expect(note?.message.split(' ').length).toBeLessThanOrEqual(11);
  });

  it('throttles duplicate messages within cooldown window', () => {
    const note1 = throttler.evaluateCandidate({
      type: 'audio',
      severity: 'important',
      message: 'Microphone clipping detected'
    }, 1000);
    expect(note1).not.toBeNull();

    // Immediate duplicate attempt
    const note2 = throttler.evaluateCandidate({
      type: 'audio',
      severity: 'important',
      message: 'Microphone clipping detected'
    }, 2000);
    expect(note2).toBeNull();
  });

  it('allows higher severity note to preempt an active lower severity note', () => {
    // 1. Polish note at t = 1000
    const polishNote = throttler.evaluateCandidate({
      type: 'pacing',
      severity: 'polish',
      message: 'Nice conversational pace'
    }, 1000);
    expect(polishNote).not.toBeNull();

    // 2. Critical note at t = 1500 (should preempt active note)
    const criticalNote = throttler.evaluateCandidate({
      type: 'framing',
      severity: 'critical',
      message: 'Face missing from camera frame'
    }, 1500);
    expect(criticalNote).not.toBeNull();
    expect(criticalNote?.severity).toBe('critical');

    // 3. Important note at t = 1800 should NOT preempt active critical note
    const importantNote = throttler.evaluateCandidate({
      type: 'lighting',
      severity: 'important',
      message: 'Slightly underexposed'
    }, 1800);
    expect(importantNote).toBeNull();
  });
});

