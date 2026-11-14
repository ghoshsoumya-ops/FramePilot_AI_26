export interface ScriptSection {
  id: string;
  title: string;
  content: string;
  expectedKeywords: string[];
  completed: boolean;
  progress: number; // 0 to 1
}

export interface ScriptMatchResult {
  currentSectionId: string;
  overallProgress: number; // 0 to 1
  matchedKeywords: string[];
  missingKeywords: string[];
  isDrifting: boolean;
  driftConfidence: number; // 0 to 1
}

/**
 * Normalizes text for clean token comparison
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits normalized text into significant tokens (ignoring common stop words)
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'i', 'you', 'we', 'they', 'this', 'so', 'just', 'like', 'or', 'if'
]);

export function extractTokens(text: string): string[] {
  const norm = normalizeText(text);
  if (!norm) return [];
  return norm
    .split(' ')
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Parses raw text or markdown into logical script sections
 */
export function parseScript(rawText: string): ScriptSection[] {
  if (!rawText || !rawText.trim()) {
    return [
      {
        id: 'sec-intro',
        title: 'Introduction & Hook',
        content: 'Welcome to this video.',
        expectedKeywords: ['welcome', 'video'],
        completed: false,
        progress: 0
      }
    ];
  }

  // Check if text has header markers like #, ##, or "Section:", "Hook:", etc.
  const lines = rawText.split('\n');
  const sections: ScriptSection[] = [];
  let currentTitle = 'Hook & Introduction';
  let currentContentLines: string[] = [];
  let sectionIndex = 1;

  const isHeaderLine = (line: string) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('#') ||
      /^(hook|intro|introduction|main point|point \d|conclusion|call to action|cta)[\s:]/i.test(trimmed)
    );
  };

  const flushSection = () => {
    const content = currentContentLines.join('\n').trim();
    if (content || sections.length === 0) {
      const id = `sec-${sectionIndex++}`;
      const tokens = Array.from(new Set(extractTokens(content || currentTitle)));
      sections.push({
        id,
        title: currentTitle.replace(/^#+\s*/, '').trim(),
        content: content || currentTitle,
        expectedKeywords: tokens,
        completed: false,
        progress: 0
      });
    }
    currentContentLines = [];
  };

  for (const line of lines) {
    if (isHeaderLine(line)) {
      if (currentContentLines.length > 0 || sections.length > 0) {
        flushSection();
      }
      currentTitle = line.trim();
    } else {
      currentContentLines.push(line);
    }
  }
  flushSection();

  return sections.length > 0
    ? sections
    : [
        {
          id: 'sec-1',
          title: 'Full Script',
          content: rawText.trim(),
          expectedKeywords: Array.from(new Set(extractTokens(rawText))),
          completed: false,
          progress: 0
        }
      ];
}

/**
 * Calculates token overlap similarity between two token lists
 */
export function calculateTokenOverlap(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setB = new Set(tokensB);
  let matched = 0;
  for (const token of tokensA) {
    if (setB.has(token)) matched++;
  }
  return matched / Math.max(tokensA.length, 1);
}

/**
 * Evaluates spoken transcript against script sections and determines progress & drift
 */
export function matchTranscriptToScript(
  transcript: string,
  sections: ScriptSection[],
  currentSectionIndex: number,
  mode: 'strict' | 'flexible' | 'coach' = 'flexible'
): ScriptMatchResult {
  if (sections.length === 0) {
    return {
      currentSectionId: '',
      overallProgress: 1,
      matchedKeywords: [],
      missingKeywords: [],
      isDrifting: false,
      driftConfidence: 0
    };
  }

  const safeIndex = Math.min(Math.max(0, currentSectionIndex), sections.length - 1);
  const targetSection = sections[safeIndex];
  const spokenTokens = extractTokens(transcript);
  const targetTokens = targetSection.expectedKeywords;

  // Thresholds based on director mode
  const completionThreshold = mode === 'strict' ? 0.65 : mode === 'flexible' ? 0.45 : 0.35;
  const driftThreshold = mode === 'strict' ? 0.15 : mode === 'flexible' ? 0.08 : 0.05;

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  const spokenSet = new Set(spokenTokens);
  for (const kw of targetTokens) {
    if (spokenSet.has(kw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const matchRatio = targetTokens.length > 0 ? matchedKeywords.length / targetTokens.length : 1;
  targetSection.progress = Math.min(1, Math.max(targetSection.progress, matchRatio));

  if (targetSection.progress >= completionThreshold) {
    targetSection.completed = true;
  }

  // Detect script drift: if creator has spoken sufficient words (>= 8 words) but matches very little of target
  const recentSpoken = spokenTokens.slice(-30);
  const recentOverlap = calculateTokenOverlap(recentSpoken, targetTokens);
  const isDrifting = recentSpoken.length >= 8 && recentOverlap < driftThreshold;
  const driftConfidence = isDrifting ? Math.min(1, (1 - recentOverlap) * 0.9) : 0;

  // Calculate overall script completion progress
  const completedCount = sections.filter(s => s.completed).length;
  const partialSum = sections.reduce((sum, s) => sum + s.progress, 0);
  const overallProgress = Math.min(1, partialSum / sections.length);

  return {
    currentSectionId: targetSection.id,
    overallProgress,
    matchedKeywords,
    missingKeywords,
    isDrifting,
    driftConfidence
  };
}
