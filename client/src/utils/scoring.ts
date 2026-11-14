export interface ScoreInputMetrics {
  durationSeconds: number;
  framingIssuesCount: number;
  lightingIssuesCount: number;
  blurEventsCount: number;
  audioClippingCount: number;
  silenceCount: number;
  fillerWordsCount: number;
  estimatedWpm: number;
  totalSections: number;
  completedSections: number;
  scriptDriftCount: number;
}

export interface DetailedScores {
  overall: number;
  delivery: number;
  technical: number;
  scriptFidelity: number;
  audioQuality: number;
  contentStructure: number;
  breakdown: {
    deliveryDeductions: string[];
    technicalDeductions: string[];
    audioDeductions: string[];
    scriptDeductions: string[];
  };
}

/**
 * Transparent, deterministic score calculator (0 to 100)
 */
export function calculatePerformanceScores(metrics: ScoreInputMetrics): DetailedScores {
  const deliveryDeductions: string[] = [];
  const technicalDeductions: string[] = [];
  const audioDeductions: string[] = [];
  const scriptDeductions: string[] = [];

  // 1. Technical Quality (Base: 100)
  let technical = 100;
  if (metrics.framingIssuesCount > 0) {
    const penalty = Math.min(25, metrics.framingIssuesCount * 5);
    technical -= penalty;
    technicalDeductions.push(`Framing drift (-${penalty} pts)`);
  }
  if (metrics.lightingIssuesCount > 0) {
    const penalty = Math.min(20, metrics.lightingIssuesCount * 6);
    technical -= penalty;
    technicalDeductions.push(`Lighting/exposure fluctuations (-${penalty} pts)`);
  }
  if (metrics.blurEventsCount > 0) {
    const penalty = Math.min(15, metrics.blurEventsCount * 5);
    technical -= penalty;
    technicalDeductions.push(`Soft focus / blur (-${penalty} pts)`);
  }
  technical = Math.max(35, Math.min(100, technical));

  // 2. Audio Quality (Base: 100)
  let audioQuality = 100;
  if (metrics.audioClippingCount > 0) {
    const penalty = Math.min(30, metrics.audioClippingCount * 10);
    audioQuality -= penalty;
    audioDeductions.push(`Microphone clipping (-${penalty} pts)`);
  }
  if (metrics.silenceCount > 3) {
    const penalty = Math.min(20, (metrics.silenceCount - 3) * 4);
    audioQuality -= penalty;
    audioDeductions.push(`Extended silence / dropouts (-${penalty} pts)`);
  }
  audioQuality = Math.max(40, Math.min(100, audioQuality));

  // 3. Delivery Score (Base: 95)
  let delivery = 95;
  if (metrics.fillerWordsCount > 2) {
    const penalty = Math.min(20, (metrics.fillerWordsCount - 2) * 3);
    delivery -= penalty;
    deliveryDeductions.push(`Excess filler words (-${penalty} pts)`);
  }
  if (metrics.estimatedWpm > 175) {
    delivery -= 10;
    deliveryDeductions.push('Pacing rushed (>175 WPM, -10 pts)');
  } else if (metrics.estimatedWpm < 100 && metrics.estimatedWpm > 0) {
    delivery -= 8;
    deliveryDeductions.push('Pacing tentative (<100 WPM, -8 pts)');
  }
  delivery = Math.max(45, Math.min(100, delivery));

  // 4. Script Fidelity (Base: 100)
  let scriptFidelity = 100;
  if (metrics.totalSections > 0) {
    const ratio = metrics.completedSections / metrics.totalSections;
    scriptFidelity = Math.round(ratio * 100);
    if (ratio < 1) {
      scriptDeductions.push(`${metrics.totalSections - metrics.completedSections} uncompleted section(s)`);
    }
  } else {
    scriptFidelity = 90;
  }
  if (metrics.scriptDriftCount > 0) {
    const penalty = Math.min(15, metrics.scriptDriftCount * 5);
    scriptFidelity -= penalty;
    scriptDeductions.push(`Script drift instances (-${penalty} pts)`);
  }
  scriptFidelity = Math.max(30, Math.min(100, scriptFidelity));

  // 5. Content Structure (Base: 90)
  let contentStructure = 90;
  if (metrics.durationSeconds < 15) {
    contentStructure -= 30;
  } else if (metrics.durationSeconds > 600) {
    contentStructure -= 15;
  }
  if (metrics.completedSections >= 3) {
    contentStructure += 8;
  }
  contentStructure = Math.max(40, Math.min(100, contentStructure));

  // Overall Weighted Score
  // Weights: Delivery 25%, Technical 25%, Script 20%, Audio 15%, Structure 15%
  const overall = Math.round(
    delivery * 0.25 +
    technical * 0.25 +
    scriptFidelity * 0.20 +
    audioQuality * 0.15 +
    contentStructure * 0.15
  );

  return {
    overall,
    delivery,
    technical,
    scriptFidelity,
    audioQuality,
    contentStructure,
    breakdown: {
      deliveryDeductions,
      technicalDeductions,
      audioDeductions,
      scriptDeductions
    }
  };
}

