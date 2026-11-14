import { useState, useEffect, useRef, useCallback } from 'react';
import {
  calculateLuminance,
  estimateLaplacianBlur,
  evaluateFaceFraming,
  FramingEvaluation
} from '../utils/videoFrame.js';

export interface FaceDetectionMetrics {
  faceDetected: boolean;
  framing: FramingEvaluation;
  averageLuminance: number;
  luminanceClassification: 'LOW_LIGHT' | 'ACCEPTABLE' | 'OVEREXPOSURE';
  blurScore: number;
  isBlurry: boolean;
}

export interface LocalVisionEvent {
  type: string;
  timestamp: number;
  message: string;
}

export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement | null>, active: boolean) {
  const [metrics, setMetrics] = useState<FaceDetectionMetrics>({
    faceDetected: false,
    framing: { status: 'OPTIMAL', message: 'Initializing vision checks...' },
    averageLuminance: 120,
    luminanceClassification: 'ACCEPTABLE',
    blurScore: 150,
    isBlurry: false
  });

  const [recentEvents, setRecentEvents] = useState<LocalVisionEvent[]>([]);
  const detectorRef = useRef<any>(null);
  const isModelReadyRef = useRef<boolean>(false);
  const intervalRef = useRef<any>(null);
  const lastEventTimeRef = useRef<Map<string, number>>(new Map());

  // Helper to emit throttled event
  const emitLocalEvent = useCallback((type: string, message: string) => {
    const now = Date.now();
    const lastTime = lastEventTimeRef.current.get(type) || 0;
    if (now - lastTime < 7000) return; // 7s cooldown per local event

    lastEventTimeRef.current.set(type, now);
    const evt: LocalVisionEvent = { type, timestamp: now, message };
    setRecentEvents(prev => [...prev.slice(-15), evt]);
  }, []);

  // Initialize MediaPipe FaceDetector safely
  useEffect(() => {
    let isCancelled = false;

    async function initDetector() {
      try {
        const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        if (isCancelled) return;

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
            delegate: 'GPU'
          },
          runningMode: 'IMAGE'
        });

        if (!isCancelled) {
          detectorRef.current = detector;
          isModelReadyRef.current = true;
        }
      } catch (err) {
        console.warn('[useFaceDetection] MediaPipe init fallback active (running standard canvas heuristics):', err);
        isModelReadyRef.current = false;
      }
    }

    initDetector();

    return () => {
      isCancelled = true;
      if (detectorRef.current) {
        try {
          detectorRef.current.close();
        } catch {
          // ignore
        }
        detectorRef.current = null;
      }
    };
  }, []);

  // Run vision sampling loop at ~1 FPS
  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      // Sample a lightweight downscaled frame (e.g. 320x240)
      const sampleWidth = 320;
      const sampleHeight = Math.round((video.videoHeight * sampleWidth) / video.videoWidth);
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;

      if (!ctx) return;
      ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
      const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);

      // 1. Luminance check
      const lumResult = calculateLuminance(imgData);
      if (lumResult.classification === 'LOW_LIGHT') {
        emitLocalEvent('LOW_LIGHT', 'Your face appears underexposed. Move toward light.');
      } else if (lumResult.classification === 'OVEREXPOSURE') {
        emitLocalEvent('OVEREXPOSURE', 'Lighting is overexposed. Soften key light.');
      }

      // 2. Blur / sharpness check
      const blurScore = estimateLaplacianBlur(imgData);
      const isBlurry = blurScore < 25;
      if (isBlurry) {
        emitLocalEvent('BLUR_DETECTED', 'Camera focus appears soft or blurred.');
      }

      // 3. Face detection & framing
      let faceDetected = false;
      let framing: FramingEvaluation = { status: 'OPTIMAL', message: 'Framing optimal' };

      if (isModelReadyRef.current && detectorRef.current) {
        try {
          const detections = detectorRef.current.detect(canvas);
          if (detections.detections && detections.detections.length > 0) {
            faceDetected = true;
            const bbox = detections.detections[0].boundingBox;
            const normBox = {
              xCenter: (bbox.originX + bbox.width / 2) / sampleWidth,
              yCenter: (bbox.originY + bbox.height / 2) / sampleHeight,
              width: bbox.width / sampleWidth,
              height: bbox.height / sampleHeight
            };
            framing = evaluateFaceFraming(normBox);
          } else {
            faceDetected = false;
            framing = { status: 'FACE_MISSING', message: 'No face detected in camera frame.' };
          }
        } catch {
          // fallback
          faceDetected = true;
        }
      } else {
        // Fallback heuristic: assume center subject if good luminance
        faceDetected = lumResult.classification !== 'LOW_LIGHT';
      }

      if (framing.status !== 'OPTIMAL') {
        emitLocalEvent(framing.status, framing.message);
      }

      setMetrics({
        faceDetected,
        framing,
        averageLuminance: lumResult.averageLuminance,
        luminanceClassification: lumResult.classification,
        blurScore,
        isBlurry
      });
    }, 1000); // 1 FPS sample rate

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, videoRef, emitLocalEvent]);

  return {
    metrics,
    recentEvents,
    clearEvents: () => setRecentEvents([])
  };
}

