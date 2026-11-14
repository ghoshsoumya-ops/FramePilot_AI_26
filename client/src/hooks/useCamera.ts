import { useState, useEffect, useRef, useCallback } from 'react';

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Enumerate cameras
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices
        .filter(d => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`
        }));
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Error enumerating cameras:', err);
    }
  }, [selectedDeviceId]);

  // Start or switch camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setPermissionError(null);
      // Stop any existing tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoElementRef.current) {
        videoElementRef.current.srcObject = newStream;
      }

      await refreshDevices();
    } catch (err: any) {
      console.error('Camera stream access failed:', err);
      let msg = 'Could not access camera/microphone. Please ensure permissions are granted.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera and microphone access in browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera device found on this system.';
      }
      setPermissionError(msg);
    }
  }, [stream, refreshDevices]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
  }, [stream]);

  // MediaRecorder MIME type detection
  const getSupportedMimeType = (): string => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // Start recording
  const startRecording = useCallback(() => {
    if (!stream) {
      console.warn('Cannot record: no active stream');
      return;
    }

    recordedChunksRef.current = [];
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
      setRecordedBlobUrl(null);
    }

    const mimeType = getSupportedMimeType();
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

    try {
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'video/webm'
        });
        const url = URL.createObjectURL(fullBlob);
        setRecordedBlobUrl(url);
      };

      recorder.start(1000); // 1s slices
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
    } catch (err: any) {
      console.error('MediaRecorder start failed:', err);
    }
  }, [stream, recordedBlobUrl]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        const recorder = mediaRecorderRef.current;
        recorder.onstop = () => {
          const fullBlob = new Blob(recordedChunksRef.current, {
            type: recorder.mimeType || 'video/webm'
          });
          const url = URL.createObjectURL(fullBlob);
          setRecordedBlobUrl(url);
          setIsRecording(false);
          setIsPaused(false);
          resolve(url);
        };
        recorder.stop();
      } else {
        setIsRecording(false);
        setIsPaused(false);
        resolve(recordedBlobUrl);
      }
    });
  }, [recordedBlobUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (recordedBlobUrl) {
        URL.revokeObjectURL(recordedBlobUrl);
      }
    };
  }, []);

  return {
    stream,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    permissionError,
    videoElementRef,
    startCamera,
    stopCamera,
    refreshDevices,
    isRecording,
    isPaused,
    recordedBlobUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
  };
}

