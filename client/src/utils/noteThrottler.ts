export type NoteSeverity = 'critical' | 'important' | 'polish';

export interface DirectorNote {
  id: string;
  type: string;
  severity: NoteSeverity;
  message: string;
  action?: string;
  timestamp: number;
}

export interface ThrottlerConfig {
  cooldownMsPerType?: number;
  duplicateMessageCooldownMs?: number;
  maxWords?: number;
}

export class DirectorNoteThrottler {
  private lastNotesByType = new Map<string, number>();
  private recentMessages = new Map<string, number>();
  private activeNote: DirectorNote | null = null;
  private activeNoteExpiresAt = 0;

  private cooldownMsPerType: number;
  private duplicateMessageCooldownMs: number;
  private maxWords: number;

  constructor(config: ThrottlerConfig = {}) {
    this.cooldownMsPerType = config.cooldownMsPerType ?? 8000;
    this.duplicateMessageCooldownMs = config.duplicateMessageCooldownMs ?? 15000;
    this.maxWords = config.maxWords ?? 14;
  }

  /**
   * Truncates message to approx maxWords with proper ellipsis
   */
  private truncateWords(text: string): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= this.maxWords) return text;
    return words.slice(0, this.maxWords).join(' ') + '...';
  }

  /**
   * Severity priority number (higher = more urgent)
   */
  public static getSeverityWeight(severity: NoteSeverity): number {
    switch (severity) {
      case 'critical':
        return 3;
      case 'important':
        return 2;
      case 'polish':
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Determines if candidate note can be shown right now.
   * If yes, registers it as active and returns sanitized note. If not, returns null.
   */
  public evaluateCandidate(
    candidate: Omit<DirectorNote, 'id' | 'timestamp'>,
    now: number = Date.now()
  ): DirectorNote | null {
    const cleanMsg = this.truncateWords(candidate.message);
    const msgKey = `${candidate.type}:${cleanMsg.toLowerCase()}`;

    // 1. Check duplicate message cooldown
    const lastMsgTime = this.recentMessages.get(msgKey);
    if (lastMsgTime && now - lastMsgTime < this.duplicateMessageCooldownMs) {
      return null;
    }

    // 2. Check issue type cooldown (unless candidate is critical)
    if (candidate.severity !== 'critical') {
      const lastTypeTime = this.lastNotesByType.get(candidate.type);
      if (lastTypeTime && now - lastTypeTime < this.cooldownMsPerType) {
        return null;
      }
    }

    // 3. Check active note collision
    if (this.activeNote && now < this.activeNoteExpiresAt) {
      const activeWeight = DirectorNoteThrottler.getSeverityWeight(this.activeNote.severity);
      const candWeight = DirectorNoteThrottler.getSeverityWeight(candidate.severity);

      // Only preempt if strictly higher severity
      if (candWeight <= activeWeight) {
        return null;
      }
    }

    // Accept candidate
    const noteId = `note-${now}-${Math.random().toString(36).slice(2, 6)}`;
    const note: DirectorNote = {
      id: noteId,
      type: candidate.type,
      severity: candidate.severity,
      message: cleanMsg,
      action: candidate.action ? this.truncateWords(candidate.action) : undefined,
      timestamp: now
    };

    // Active display duration: critical (6s), important (5s), polish (4s)
    const durationMs = candidate.severity === 'critical' ? 6000 : candidate.severity === 'important' ? 5000 : 4000;
    this.activeNote = note;
    this.activeNoteExpiresAt = now + durationMs;

    this.lastNotesByType.set(candidate.type, now);
    this.recentMessages.set(msgKey, now);

    return note;
  }

  public getActiveNote(now: number = Date.now()): DirectorNote | null {
    if (this.activeNote && now < this.activeNoteExpiresAt) {
      return this.activeNote;
    }
    this.activeNote = null;
    return null;
  }

  public clear(): void {
    this.activeNote = null;
    this.activeNoteExpiresAt = 0;
    this.lastNotesByType.clear();
    this.recentMessages.clear();
  }
}

