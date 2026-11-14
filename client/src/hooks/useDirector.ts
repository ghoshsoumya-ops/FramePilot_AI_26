import { useState, useEffect, useRef, useCallback } from 'react';
import { DirectorNoteThrottler, DirectorNote } from '../utils/noteThrottler.js';
import { captureDownscaledFrame } from '../utils/videoFrame.js';
import { ApiService, CoachPayload } from '../services/api.js';
import { DirectorMode, PrivacyMode } from '../store/appStore.js';

interface UseDirectorProps {
  isRecording: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  directorMode: DirectorMode;
  privacyMode: PrivacyMode;
  hasFrameConsent: boolean;
  scriptText?: string;
  currentSectionTitle?: string;
  transcript: string;
  visionMetrics: any;
  visionEvents: any[];
  audioMetrics: any;
  clippingCount: number;
  silenceCount: number;
  estimatedWpm: number;
  fillerCount: number;
}

export function useDirector(props: UseDirectorProps) {
  const [activeNote, setActiveNote] = useState<DirectorNote | null>(null);
  const [notesHistory, setNotesHistory] = useState<DirectorNote[]>([]);
  const [takeScores, setTakeScores] = useState({
    delivery: 9,
    technical: 9,
    scriptFidelity: 9
  });
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const throttlerRef = useRef<DirectorNoteThrottler>(new DirectorNoteThrottler());
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastAiEvaluationTimeRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);

  // Evaluate candidate note into active display & history
  const dispatchCandidateNote = useCallback(
    (cand: { type: string; severity: 'critical' | 'important' | 'polish'; message: string; action?: string }) => {
      const throttler = throttlerRef.current;
      const registered = throttler.evaluateCandidate(cand);
      if (registered) {
        setActiveNote(registered);
        setNotesHistory(prev => [...prev, registered]);
      }
    },
    []
  );

  // 1. Stage 1: Local Real-Time Checks
  useEffect(() => {
    if (!props.isRecording) return;

    // Check Audio Clipping
    if (props.audioMetrics.isClipping) {
      dispatchCandidateNote({
        type: 'audio',
        severity: 'critical',
        message: 'Microphone clipping detected. Back away slightly.',
        action: 'Lower input gain or speak softer.'
      });
    }

    // Check Long Silence
    if (props.audioMetrics.consecutiveSilenceMs > 4000) {
      dispatchCandidateNote({
        type: 'audio',
        severity: 'polish',
        message: 'Long pause detected.',
        action: 'Continue to the next talking point.'
      });
    }

    // Check Lighting
    if (props.visionMetrics.luminanceClassification === 'LOW_LIGHT') {
      dispatchCandidateNote({
        type: 'lighting',
        severity: 'important',
        message: 'Face underexposed. Add front light.',
        action: 'Move toward a light source.'
      });
    }

    // Check Framing
    if (props.visionMetrics.framing && props.visionMetrics.framing.status !== 'OPTIMAL') {
      const severity = props.visionMetrics.framing.status === 'FACE_MISSING' ? 'critical' : 'important';
      dispatchCandidateNote({
        type: 'framing',
        severity,
        message: props.visionMetrics.framing.message,
        action: 'Re-align yourself to center frame.'
      });
    }
  }, [
    props.isRecording,
    props.audioMetrics.isClipping,
    props.audioMetrics.consecutiveSilenceMs,
    props.visionMetrics.luminanceClassification,
    props.visionMetrics.framing,
    dispatchCandidateNote
  ]);

  // 2. Stage 2: Periodic Escalation to Backend Coach
  const triggerAiEscalation = useCallback(async () => {
    if (!props.isRecording) return;
    if (props.privacyMode === 'local') return; // Strict local-only privacy

    // Prevent duplicate in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Downscale frame if consented
    let frames: string[] = [];
    if (props.privacyMode === 'ai-assisted' && props.hasFrameConsent && props.videoRef.current) {
      const frameBase64 = captureDownscaledFrame(props.videoRef.current, 480, 0.65);
      if (frameBase64) {
        frames.push(frameBase64);
      }
    }

    const payload: CoachPayload = {
      mode: props.directorMode,
      script: props.scriptText,
      currentSection: props.currentSectionTitle,
      transcript: props.transcript.slice(-300), // recent transcript
      localEvents: props.visionEvents.slice(-5),
      metrics: {
        faceDetected: props.visionMetrics.faceDetected,
        faceFraming: props.visionMetrics.framing?.status,
        brightness: props.visionMetrics.averageLuminance,
        blurScore: props.visionMetrics.blurScore,
        audioLevelRms: props.audioMetrics.rmsLevel,
        wordsPerMinute: props.estimatedWpm,
        silenceDurationMs: props.audioMetrics.consecutiveSilenceMs,
        fillerCount: props.fillerCount
      },
      recentNotes: notesHistory.slice(-4).map(n => n.message),
      frames
    };

    try {
      setIsAiLoading(true);
      const res = await ApiService.getCoachFeedback(payload, controller.signal);
      setIsAiLoading(false);

      if (res.take_score) {
        setTakeScores(res.take_score);
      }

      if (res.issues && res.issues.length > 0) {
        const topIssue = res.issues[0];
        dispatchCandidateNote({
          type: topIssue.type,
          severity: topIssue.severity,
          message: topIssue.message,
          action: topIssue.action
        });
      } else if (res.praise) {
        dispatchCandidateNote({
          type: 'delivery',
          severity: 'polish',
          message: res.praise
        });
      }
    } catch (err: any) {
      setIsAiLoading(false);
      if (err.name !== 'AbortError') {
        console.warn('[useDirector] AI coach tick skipped or offline fallback used.');
      }
    }
  }, [
    props.isRecording,
    props.privacyMode,
    props.hasFrameConsent,
    props.directorMode,
    props.scriptText,
    props.currentSectionTitle,
    props.transcript,
    props.visionEvents,
    props.visionMetrics,
    props.audioMetrics,
    props.estimatedWpm,
    props.fillerCount,
    props.videoRef,
    notesHistory,
    dispatchCandidateNote
  ]);

  // Schedule AI heartbeat check every 8-10 seconds
  useEffect(() => {
    if (!props.isRecording) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastAiEvaluationTimeRef.current >= 8000) {
        lastAiEvaluationTimeRef.current = now;
        triggerAiEscalation();
      }
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [props.isRecording, triggerAiEscalation]);

  // Check active note expiration regularly
  useEffect(() => {
    const timer = setInterval(() => {
      const current = throttlerRef.current.getActiveNote();
      setActiveNote(current);
    }, 300);

    return () => clearInterval(timer);
  }, []);

  const resetDirector = useCallback(() => {
    throttlerRef.current.clear();
    setActiveNote(null);
    setNotesHistory([]);
    lastAiEvaluationTimeRef.current = 0;
  }, []);

  return {
    activeNote,
    notesHistory,
    takeScores,
    isAiLoading,
    resetDirector
  };
}

