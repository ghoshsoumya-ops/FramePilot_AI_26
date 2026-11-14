import { useState, useEffect, useRef, useCallback } from 'react';

const COMMON_FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally', 'sort of', 'kind of', 'i mean'
];

export interface SpeechRecognitionState {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  fillerWordCount: number;
  estimatedWpm: number;
  interimText: string;
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [fillerWordCount, setFillerWordCount] = useState<number>(0);
  const [estimatedWpm, setEstimatedWpm] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null);
  const fullTranscriptRef = useRef<string>('');

  const isSupported = typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const countFillers = (text: string): number => {
    const lower = text.toLowerCase();
    let count = 0;
    for (const filler of COMMON_FILLER_WORDS) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) count += matches.length;
    }
    return count;
  };

  const calculateWpm = useCallback((text: string, startMs: number | null): number => {
    if (!startMs) return 0;
    const elapsedMinutes = (Date.now() - startMs) / 60000;
    if (elapsedMinutes < 0.15) return 0; // Don't calculate for the first 9 seconds
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    return Math.round(words / elapsedMinutes);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setIsListening(true);
      startTimeRef.current = Date.now();
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        if (!startTimeRef.current) startTimeRef.current = Date.now();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalizedSegment = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalizedSegment += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript;
          }
        }

        if (finalizedSegment) {
          fullTranscriptRef.current = (fullTranscriptRef.current + ' ' + finalizedSegment).trim();
          setTranscript(fullTranscriptRef.current);
          setFillerWordCount(countFillers(fullTranscriptRef.current));
          setEstimatedWpm(calculateWpm(fullTranscriptRef.current, startTimeRef.current));
        }
        setInterimText(interim);
      };

      recognition.onerror = (err: any) => {
        // Non-fatal, just log and keep graceful fallback
        console.warn('[useSpeechRecognition] Speech recognition notice:', err.error);
      };

      recognition.onend = () => {
        // If still expected to listen, restart (browser speech recognition often ends after brief pauses)
        if (isListening && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('[useSpeechRecognition] Start failed, manual mode active:', err);
      setIsListening(true);
      startTimeRef.current = Date.now();
    }
  }, [isSupported, isListening, calculateWpm]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    fullTranscriptRef.current = '';
    setTranscript('');
    setInterimText('');
    setFillerWordCount(0);
    setEstimatedWpm(0);
    startTimeRef.current = null;
  }, []);

  // Manual fallback updater
  const updateManualTranscript = useCallback((newText: string) => {
    fullTranscriptRef.current = newText;
    setTranscript(newText);
    setFillerWordCount(countFillers(newText));
    setEstimatedWpm(calculateWpm(newText, startTimeRef.current || Date.now() - 30000));
  }, [calculateWpm]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    transcript,
    interimText,
    isListening,
    isSupported,
    fillerWordCount,
    estimatedWpm,
    startListening,
    stopListening,
    resetTranscript,
    updateManualTranscript
  };
}

