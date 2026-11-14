import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioMetrics {
  rmsLevel: number; // 0 to 1
  decibels: number; // -100 to 0 dB
  isSpeaking: boolean;
  isClipping: boolean;
  isSilent: boolean;
  consecutiveSilenceMs: number;
}

export function useAudioMonitor(stream: MediaStream | null) {
  const [metrics, setMetrics] = useState<AudioMetrics>({
    rmsLevel: 0,
    decibels: -100,
    isSpeaking: false,
    isClipping: false,
    isSilent: true,
    consecutiveSilenceMs: 0
  });

  const [clippingEventsCount, setClippingEventsCount] = useState<number>(0);
  const [silenceEventsCount, setSilenceEventsCount] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastActiveTimeRef = useRef<number>(Date.now());
  const silenceReportedRef = useRef<boolean>(false);

  const initAudio = useCallback(() => {
    if (!stream || stream.getAudioTracks().length === 0) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.fftSize;
      const timeDomainData = new Float32Array(bufferLength);

      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(timeDomainData);

        // Compute RMS
        let sumSquares = 0;
        let isClippingSample = false;

        for (let i = 0; i < bufferLength; i++) {
          const sample = timeDomainData[i];
          sumSquares += sample * sample;
          if (Math.abs(sample) >= 0.98) {
            isClippingSample = true;
          }
        }

        const rms = Math.sqrt(sumSquares / bufferLength);
        const clampedRms = Math.min(1, Math.max(0, rms));
        const db = rms > 0 ? Math.max(-100, Math.round(20 * Math.log10(rms))) : -100;

        const isSpeaking = clampedRms > 0.04;
        const now = Date.now();

        if (isSpeaking) {
          lastActiveTimeRef.current = now;
          silenceReportedRef.current = false;
        }

        const silenceDuration = now - lastActiveTimeRef.current;
        const isSilent = silenceDuration > 2500; // 2.5s threshold

        if (isClippingSample) {
          setClippingEventsCount(c => c + 1);
        }

        if (isSilent && !silenceReportedRef.current && silenceDuration > 4000) {
          setSilenceEventsCount(c => c + 1);
          silenceReportedRef.current = true;
        }

        setMetrics({
          rmsLevel: clampedRms,
          decibels: db,
          isSpeaking,
          isClipping: isClippingSample,
          isSilent,
          consecutiveSilenceMs: silenceDuration
        });

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.warn('[useAudioMonitor] Failed to initialize Web Audio context:', err);
    }
  }, [stream]);

  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => {
    initAudio();
    return () => cleanupAudio();
  }, [initAudio, cleanupAudio]);

  const resetCounts = useCallback(() => {
    setClippingEventsCount(0);
    setSilenceEventsCount(0);
    lastActiveTimeRef.current = Date.now();
  }, []);

  return {
    metrics,
    clippingEventsCount,
    silenceEventsCount,
    resetCounts
  };
}

