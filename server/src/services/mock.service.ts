import {
  CoachRequest,
  CoachResponse,
  TakeReportRequest,
  TakeReportResponse,
  GenerateScriptRequest,
  GenerateScriptResponse,
  GenerateHooksRequest,
  GenerateHooksResponse,
  AnalyzeUploadRequest,
  AnalyzeUploadResponse,
  DirectorIssue
} from '../schemas/director.schema.js';

export class MockService {
  /**
   * Generates a context-aware mock coaching response based on incoming local events and transcript
   */
  static getCoachFeedback(req: CoachRequest): CoachResponse {
    const issues: DirectorIssue[] = [];
    let praise: string | null = null;
    let suggestRetake = false;

    // Inspect local events first to provide genuinely relevant director feedback
    const latestEvent = req.localEvents?.[req.localEvents.length - 1];

    if (latestEvent) {
      switch (latestEvent.type) {
        case 'LOW_LIGHT':
          issues.push({
            type: 'lighting',
            severity: 'important',
            message: 'Your face appears underexposed.',
            action: 'Move toward a light source or face the window.'
          });
          break;
        case 'OVEREXPOSURE':
          issues.push({
            type: 'lighting',
            severity: 'important',
            message: 'Strong backlight causing overexposure.',
            action: 'Lower front exposure or soften the key light.'
          });
          break;
        case 'FACE_OFF_CENTER':
          issues.push({
            type: 'framing',
            severity: 'important',
            message: 'Face drifted out of center third.',
            action: 'Re-center your position slightly.'
          });
          break;
        case 'FACE_TOO_CLOSE':
          issues.push({
            type: 'framing',
            severity: 'important',
            message: 'Camera is too close to your face.',
            action: 'Step back 6-12 inches for natural head room.'
          });
          break;
        case 'FACE_TOO_FAR':
          issues.push({
            type: 'framing',
            severity: 'important',
            message: 'You are framed too far in the shot.',
            action: 'Move closer to maintain intimate eye contact.'
          });
          break;
        case 'FACE_MISSING':
          issues.push({
            type: 'framing',
            severity: 'critical',
            message: 'No face detected in camera frame.',
            action: 'Position yourself directly in front of the lens.'
          });
          suggestRetake = true;
          break;
        case 'BLUR_DETECTED':
          issues.push({
            type: 'focus',
            severity: 'important',
            message: 'Camera focus appears soft or blurred.',
            action: 'Tap focus or wipe your camera lens.'
          });
          break;
        case 'AUDIO_LOW':
          issues.push({
            type: 'audio',
            severity: 'important',
            message: 'Voice input level is too quiet.',
            action: 'Speak up or move microphone closer.'
          });
          break;
        case 'AUDIO_CLIPPING':
          issues.push({
            type: 'audio',
            severity: 'critical',
            message: 'Microphone is clipping or distorting.',
            action: 'Lower input gain or ease back on plosives.'
          });
          break;
        case 'AUDIO_SILENCE':
          issues.push({
            type: 'delivery',
            severity: 'polish',
            message: 'Extended pause detected.',
            action: 'Pick up your next sentence with confidence.'
          });
          break;
        case 'PACING_TOO_FAST':
          issues.push({
            type: 'pacing',
            severity: 'important',
            message: 'Speaking pace exceeds 175 words/min.',
            action: 'Breathe, slow down and enunciate key ideas.'
          });
          break;
        case 'SCRIPT_DRIFT':
          if (req.mode === 'strict') {
            issues.push({
              type: 'script',
              severity: 'important',
              message: 'Drifting away from the prepared talking point.',
              action: 'Guide the conversation back to the section goal.'
            });
          }
          break;
      }
    }

    // If no urgent issue, generate smart pacing/encouragement
    if (issues.length === 0) {
      const words = req.transcript?.trim().split(/\s+/).length || 0;
      if (words > 15) {
        praise = req.mode === 'coach'
          ? 'Great projection and conversational cadence. Maintain this rhythm.'
          : 'Clean delivery on this section. Keep moving forward!';
      }
    }

    return {
      timestamp: Date.now(),
      script_position: {
        section_id: req.currentSection || 'introduction',
        confidence: 0.92
      },
      issues,
      praise,
      suggest_retake: suggestRetake,
      take_score: {
        delivery: Math.min(10, Math.max(6, 8 - (issues.length > 0 ? 1 : 0))),
        technical: Math.min(10, Math.max(5, 9 - (latestEvent ? 1 : 0))),
        script_fidelity: req.mode === 'strict' ? 8 : 9
      },
      isMock: true
    };
  }

  /**
   * Generates comprehensive take report
   */
  static getTakeReport(req: TakeReportRequest): TakeReportResponse {
    const dur = req.durationSeconds || 60;
    const clipping = req.metricsSummary?.clippingEventsCount || 0;
    const silences = req.metricsSummary?.silenceEventsCount || 0;
    const framingIssues = req.metricsSummary?.framingIssuesCount || 0;
    const fillers = req.metricsSummary?.fillerWordCount || 0;
    const wpm = req.metricsSummary?.estimatedWpm || 135;

    // Calculate deterministic realistic scores
    const technicalScore = Math.max(40, Math.min(98, 95 - framingIssues * 5 - (clipping > 0 ? 10 : 0)));
    const deliveryScore = Math.max(50, Math.min(96, 92 - Math.min(25, fillers * 2) - (silences > 2 ? 8 : 0)));
    const audioScore = Math.max(50, Math.min(98, 95 - clipping * 8 - (silences > 3 ? 5 : 0)));
    const scriptFidelity = req.sections.length > 0
      ? Math.round((req.sections.filter(s => s.completed).length / req.sections.length) * 100)
      : 88;
    const structureScore = Math.max(60, Math.min(95, 90 + (dur >= 30 && dur <= 300 ? 5 : -10)));

    const overallScore = Math.round(
      deliveryScore * 0.25 +
      technicalScore * 0.25 +
      scriptFidelity * 0.2 +
      audioScore * 0.15 +
      structureScore * 0.15
    );

    const completed = req.sections.filter(s => s.completed).map(s => s.title);
    const incomplete = req.sections.filter(s => !s.completed);

    const retakes = incomplete.map(s => ({
      sectionId: s.id,
      sectionTitle: s.title,
      reason: 'Section was rushed or skipped during delivery.',
      recommended: true
    }));

    if (retakes.length === 0 && overallScore < 75) {
      retakes.push({
        sectionId: 'main-take',
        sectionTitle: 'Main Take Delivery',
        reason: 'Pacing was slightly uneven; one more take with relaxed cadence will boost retention.',
        recommended: false
      });
    }

    return {
      overallScore,
      categoryScores: {
        delivery: deliveryScore,
        technical: technicalScore,
        scriptFidelity,
        audioQuality: audioScore,
        contentStructure: structureScore
      },
      visualAnalysis: {
        lightingQuality: framingIssues === 0 ? 'Consistent, balanced key lighting across the subject.' : 'Slight exposure fluctuations observed; ensure steady front key light.',
        framingQuality: framingIssues === 0 ? 'Stable center-third composition with proper eye-level headroom.' : 'Occasional drift toward upper or side frame boundaries.',
        facePositioning: 'Optimal distance maintained for intimate, engaging creator presentation.',
        imageSharpness: 'Clear focal lock maintained throughout the recording session.'
      },
      audioAnalysis: {
        audioLevel: clipping > 0 ? 'Peak levels triggered occasional clipping; gain was near ceiling.' : 'Crisp vocal presence with healthy dynamic range (-14 dB to -6 dB RMS).',
        clippingEvents: clipping,
        longPauses: silences,
        fillerWords: fillers,
        speakingPace: `${wpm} WPM — ${wpm > 165 ? 'Elevated tempo (slightly fast)' : wpm < 115 ? 'Deliberate, relaxed tempo' : 'Optimal conversational cadence'}`
      },
      scriptAnalysis: {
        completedSections: completed.length > 0 ? completed : ['Opening Hook', 'Core Value Point', 'Closing Call to Action'],
        skippedPoints: incomplete.map(s => s.title),
        scriptDriftSummary: req.mode === 'strict'
          ? 'Strong fidelity to scripted phrasing with minimal deviation.'
          : 'Natural conversational paraphrasing maintained the core objective smoothly.',
        keyMessagesDetected: [
          'Primary value proposition articulated clearly',
          'Audience pain point established within first 15 seconds'
        ]
      },
      performanceFeedback: {
        strongMoments: [
          'Confident initial hook delivery with direct lens contact',
          'Clean vocal projection without tentative speech patterns'
        ],
        weakMoments: fillers > 3
          ? ['Occasional filler phrases when transitioning between key ideas']
          : ['Micro-hesitations before delivering secondary talking point'],
        suggestedImprovements: [
          'Insert a deliberate 1-second pause right before revealing key insights for dramatic emphasis',
          'Keep your shoulders relaxed and maintain lens gaze when concluding'
        ]
      },
      retakeRecommendations: retakes,
      directorNotesChronological: req.notesGiven.length > 0
        ? req.notesGiven
        : [
            {
              timestamp: 5,
              type: 'delivery',
              message: 'Strong hook delivery, keep up this energy',
              severity: 'polish'
            },
            {
              timestamp: 22,
              type: 'pacing',
              message: 'Pacing optimal at 135 words per minute',
              severity: 'polish'
            }
          ],
      isMock: true
    };
  }

  /**
   * Generates a structured, engaging video script
   */
  static generateScript(req: GenerateScriptRequest): GenerateScriptResponse {
    const topic = req.topic || 'How to build high-retention video content';
    const isShort = req.duration === '30s' || req.duration === '60s' || req.platform === 'reels' || req.platform === 'shorts';

    return {
      title: `${topic.slice(0, 50)} — High-Retention Script`,
      hook: `Stop scrolling if you want to master ${topic.toLowerCase()} without wasting hours of trial and error.`,
      alternativeHooks: [
        `Here is the single biggest mistake creators make when talking about ${topic.toLowerCase()}.`,
        `Most people completely overcomplicate ${topic.toLowerCase()}. Here is the simple 3-step blueprint.`,
        `If I had to start over with ${topic.toLowerCase()}, this is the exact approach I would use.`
      ],
      sections: isShort
        ? [
            {
              id: 'sec-hook',
              title: 'Visual Hook',
              content: `Stop scrolling. If you care about ${topic.toLowerCase()}, you need to understand this fundamental shift happening right now.`,
              estimatedSeconds: 6
            },
            {
              id: 'sec-core-problem',
              title: 'The Core Problem',
              content: `The reason 90% of beginners struggle isn't lack of effort—it's following outdated advice that was never designed for how people watch videos today.`,
              estimatedSeconds: 15
            },
            {
              id: 'sec-actionable-solution',
              title: 'The 3-Step Fix',
              content: `First, identify your single core takeaway before hitting record. Second, cut the first 10 seconds of fluff. Third, speak directly to one person.`,
              estimatedSeconds: 22
            },
            {
              id: 'sec-cta',
              title: 'Call to Action',
              content: `Save this video for your next shoot, and drop a comment below with your biggest question on this.`,
              estimatedSeconds: 8
            }
          ]
        : [
            {
              id: 'sec-hook',
              title: 'Opening Hook & Disruption',
              content: `What if everything you've been told about ${topic.toLowerCase()} is keeping you stuck at square one? Today, we break down what actually works.`,
              estimatedSeconds: 15
            },
            {
              id: 'sec-intro',
              title: 'Introduction & Value Promise',
              content: `Welcome back. By the end of this video, you will have a clear, actionable system you can implement today without expensive gear or prior experience.`,
              estimatedSeconds: 30
            },
            {
              id: 'sec-point1',
              title: 'Pillar 1: The Core Foundation',
              content: `Let's start with the foundation. When you approach ${topic.toLowerCase()}, the secret is clarity over complexity. Focus on repeatable principles rather than random hacks.`,
              estimatedSeconds: 45
            },
            {
              id: 'sec-point2',
              title: 'Pillar 2: Execution & Common Traps',
              content: `Here is where most people get tripped up. They overthink their setup instead of refining their message. Remember: viewers stay for your insight, not your camera lens.`,
              estimatedSeconds: 45
            },
            {
              id: 'sec-conclusion',
              title: 'Conclusion & Practical Summary',
              content: `To recap: start simple, validate your structure early, and iterate on every take. The compound effect of these small habits is massive.`,
              estimatedSeconds: 30
            },
            {
              id: 'sec-cta',
              title: 'Closing Call to Action',
              content: `If this breakdown brought you value, hit subscribe, tap the bell icon, and let me know your thoughts in the comments below. See you in the next one!`,
              estimatedSeconds: 15
            }
          ],
      callToAction: 'Follow and save this for your next creator session!',
      isMock: true
    };
  }

  /**
   * Generates compelling hooks & engagement strategy
   */
  static generateHooks(req: GenerateHooksRequest): GenerateHooksResponse {
    const topic = req.topic;
    return {
      hooks: [
        {
          hook: `Why 95% of people fail at ${topic.toLowerCase()} within their first 30 days (and how to be the 5%).`,
          style: 'Contrarian Curiosity Gap',
          whyItWorks: 'Taps into loss aversion and positions the creator as the insider offering the escape route.'
        },
        {
          hook: `The 2-minute rule that completely changed how I think about ${topic.toLowerCase()}.`,
          style: 'Simplicity & Low Friction',
          whyItWorks: 'Promises an immediate, low-effort cognitive breakthrough that viewers can digest instantly.'
        },
        {
          hook: `I tested every popular technique for ${topic.toLowerCase()} so you don't have to. Here's the verdict.`,
          style: 'Proof & Authority Bridge',
          whyItWorks: 'Establishes high perceived value by saving the viewer dozens of hours of trial and error.'
        }
      ],
      strongerOpeningSentence: `If you are trying to master ${topic.toLowerCase()}, stop doing what everyone else is doing and test this instead.`,
      suggestedStructure: [
        'Beat 1 (0-3s): The bold pattern-interrupt hook',
        'Beat 2 (3-12s): The relatable frustration / stakes',
        'Beat 3 (12-35s): The core counter-intuitive solution',
        'Beat 4 (35-45s): The tangible immediate takeaway & CTA'
      ],
      transitions: [
        'Now, here is why that is actually good news for you...',
        'Before you apply this, there is one crucial nuance you cannot afford to skip...',
        'Which brings us directly to the golden rule...'
      ],
      callToActionSuggestion: `Save this post right now so you have the reference ready when you record your next video.`,
      rationale: `High-retention hooks work by delaying payoff just enough to create an open cognitive loop while respecting the viewer's intelligence.`,
      isMock: true
    };
  }

  /**
   * Analyzes an uploaded video file based on extracted keyframes and optional transcript
   */
  static analyzeUpload(req: AnalyzeUploadRequest): AnalyzeUploadResponse {
    const hasTranscript = req.transcript && req.transcript.trim().length > 10;
    const hasFrames = req.frames && req.frames.length > 0;

    return {
      summary: `Analysis completed for ${req.fileName} (${req.durationSeconds}s). ${hasFrames ? 'Processed visual keyframes.' : 'Standard profile applied.'} ${hasTranscript ? 'Transcribed audio content analyzed.' : 'Visual presentation analyzed (no transcript provided).'}` ,
      visualPresentation: {
        framingScore: 8,
        framingNotes: 'Subject is positioned within the central third with balanced headroom and clear sightline.',
        lightingScore: 7,
        lightingNotes: 'Even illumination across subject face with adequate key-to-fill ratio. Avoid harsh top shadows.',
        stabilityScore: 9,
        stabilityNotes: 'Static or well-stabilized mount with minimal rotational jitter.'
      },
      contentStructure: {
        hookEvaluation: hasTranscript
          ? 'Opening seconds establish the topic quickly without excessive runway.'
          : 'Visual entrance is clean; add on-screen dynamic text in the first 2 seconds to boost watch time.',
        pacingNotes: hasTranscript
          ? 'Information density is well paced across the segment.'
          : 'Pacing visually appears steady. Ensure cuts align with audio rhythm.',
        callToActionEvaluation: hasTranscript
          ? 'Clear concluding request matching the content theme.'
          : 'Ensure concluding frame leaves a memorable focal point or graphic prompt.'
      },
      suggestedHooks: [
        'What nobody talks about when starting out in this space...',
        'The quickest shortcut to improving your output quality without spending money...',
        'If I had to teach this to a friend in under 60 seconds...'
      ],
      recommendations: [
        'Add bold B-roll or dynamic zooms every 4 to 6 seconds to reset visual retention.',
        'Use punchy captions with high contrast for mobile sound-off viewers.',
        'Slightly increase vocal warmth in post-production with gentle high-pass and 3kHz presence boost.'
      ],
      isMock: true
    };
  }
}

