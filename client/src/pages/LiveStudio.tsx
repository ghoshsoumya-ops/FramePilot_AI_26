import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sliders,
  FileText,
  Volume2,
  Activity,
  AlertTriangle,
  Eye,
  CheckCircle2,
  ChevronRight,
  Shield,
  MessageSquare
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera.js';
import { useAudioMonitor } from '../hooks/useAudioMonitor.js';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { useFaceDetection } from '../hooks/useFaceDetection.js';
import { useDirector } from '../hooks/useDirector.js';
import { parseScript, matchTranscriptToScript, ScriptSection } from '../utils/scriptMatcher.js';
import { StorageService, RecordingSession } from '../services/storage.service.js';
import { ApiService, TakeReportPayload } from '../services/api.js';
import { useAppStore } from '../store/appStore.js';

export const LiveStudio: React.FC = () => {
  const navigate = useNavigate();
  const {
    directorMode,
    privacyMode,
    hasFrameConsent,
    activeScript,
    selectedCameraId,
    setLastReport,
    setLastRecordedBlobUrl
  } = useAppStore();

  const [activeRightTab, setActiveRightTab] = useState<'teleprompter' | 'transcript' | 'metrics' | 'notes'>('teleprompter');
  const [teleprompterVisible, setTeleprompterVisible] = useState<boolean>(true);
  const [micMuted, setMicMuted] = useState<boolean>(false);

  // Script tracking state
  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);

  // Timer state
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Camera & MediaRecorder
  const {
    stream,
    videoElementRef,
    startCamera,
    stopCamera,
    isRecording,
    isPaused,
    recordedBlobUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
  } = useCamera();

  // Audio Monitoring
  const {
    metrics: audioMetrics,
    clippingEventsCount,
    silenceEventsCount,
    resetCounts: resetAudioCounts
  } = useAudioMonitor(stream);

  // Speech Recognition & Pacing
  const {
    transcript,
    interimText,
    isSupported: speechSupported,
    fillerWordCount,
    estimatedWpm,
    startListening,
    stopListening,
    resetTranscript,
    updateManualTranscript
  } = useSpeechRecognition();

  // Local Vision Engine (Face detection, Framing, Luminance, Blur)
  const {
    metrics: visionMetrics,
    recentEvents: visionEvents,
    clearEvents: clearVisionEvents
  } = useFaceDetection(videoElementRef, isRecording || true);

  // Parse Script on mount
  useEffect(() => {
    if (activeScript && activeScript.rawText) {
      setSections(parseScript(activeScript.rawText));
    }
  }, [activeScript]);

  // Start Camera Stream
  useEffect(() => {
    startCamera(selectedCameraId || undefined);
    return () => {
      stopCamera();
    };
  }, [selectedCameraId]);

  // Master Director Orchestrator
  const currentSection = sections[currentSectionIndex];
  const {
    activeNote,
    notesHistory,
    takeScores,
    isAiLoading,
    resetDirector
  } = useDirector({
    isRecording,
    videoRef: videoElementRef,
    directorMode,
    privacyMode,
    hasFrameConsent,
    scriptText: activeScript?.rawText,
    currentSectionTitle: currentSection?.title,
    transcript,
    visionMetrics,
    visionEvents,
    audioMetrics,
    clippingCount: clippingEventsCount,
    silenceCount: silenceEventsCount,
    estimatedWpm,
    fillerCount: fillerWordCount
  });

  // Track script progress whenever spoken transcript updates
  useEffect(() => {
    if (sections.length > 0 && transcript) {
      const matchResult = matchTranscriptToScript(
        transcript,
        sections,
        currentSectionIndex,
        directorMode
      );

      // Auto advance to next section if current section is completed
      if (sections[currentSectionIndex]?.completed && currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(i => i + 1);
      }
    }
  }, [transcript, sections, currentSectionIndex, directorMode]);

  // Elapsed Recording Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Handle Start Recording
  const handleStartRecording = () => {
    setRecordingSeconds(0);
    resetTranscript();
    resetAudioCounts();
    clearVisionEvents();
    resetDirector();
    startListening();
    startRecording();
  };

  // Handle Pause / Resume
  const handleTogglePause = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  // Handle Restart Take
  const handleRestartTake = () => {
    if (confirm('Restart take? Current recording progress will be cleared.')) {
      setRecordingSeconds(0);
      resetTranscript();
      resetAudioCounts();
      clearVisionEvents();
      resetDirector();
      setCurrentSectionIndex(0);
    }
  };

  // Handle Mic Mute Toggle
  const handleToggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = micMuted;
      });
      setMicMuted(!micMuted);
    }
  };

  // Handle Stop Recording & Generate Report
  const handleStopRecording = async () => {
    stopListening();
    const finalBlobUrl = await stopRecording();

    // Prepare report payload
    const reportPayload: TakeReportPayload = {
      durationSeconds: Math.max(1, recordingSeconds),
      mode: directorMode,
      script: activeScript?.rawText,
      sections: sections.map(s => ({
        id: s.id,
        title: s.title,
        completed: s.completed
      })),
      fullTranscript: transcript || 'No speech recognized or manual take.',
      localEvents: visionEvents,
      notesGiven: notesHistory.map(n => ({
        timestamp: Math.round((n.timestamp - Date.now() + recordingSeconds * 1000) / 1000),
        type: n.type,
        message: n.message,
        severity: n.severity
      })),
      metricsSummary: {
        averageBrightness: visionMetrics.averageLuminance,
        framingIssuesCount: visionEvents.filter(e => e.type.startsWith('FACE_')).length,
        clippingEventsCount,
        silenceEventsCount,
        fillerWordCount,
        estimatedWpm: estimatedWpm || 135
      }
    };

    try {
      const reportRes = await ApiService.getTakeReport(reportPayload);

      // Save complete session in IndexedDB
      const sessionId = `take-${Date.now()}`;
      const sessionRecord: RecordingSession = {
        id: sessionId,
        createdAt: Date.now(),
        durationSeconds: Math.max(1, recordingSeconds),
        mode: directorMode,
        scriptTitle: activeScript?.title || 'Freestyle Studio Take',
        scriptText: activeScript?.rawText,
        overallScore: reportRes.overallScore || 88,
        categoryScores: reportRes.categoryScores || {
          delivery: 88,
          technical: 90,
          scriptFidelity: 85,
          audioQuality: 92,
          contentStructure: 88
        },
        transcript: transcript || '',
        reportData: reportRes,
        notesCount: notesHistory.length,
        videoBlobUrl: finalBlobUrl || undefined
      };

      await StorageService.saveSession(sessionRecord);
      setLastReport(reportRes);
      if (finalBlobUrl) setLastRecordedBlobUrl(finalBlobUrl);

      navigate(`/report?id=${sessionId}`);
    } catch (err) {
      console.error('Failed to generate take report:', err);
      navigate('/dashboard');
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="studio-container">
      {/* Studio Header Bar */}
      <div
        style={{
          height: '52px',
          background: 'var(--studio-surface)',
          borderBottom: '1px solid var(--studio-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isRecording ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isPaused ? '#F59E0B' : '#EF4444',
                  display: 'inline-block',
                  animation: isPaused ? 'none' : 'pulse 1.5s infinite'
                }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F8FAFC', letterSpacing: '0.05em' }}>
                {isPaused ? 'PAUSED' : 'REC'} {formatTime(recordingSeconds)}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748B' }} />
              <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>STANDBY — READY</span>
            </div>
          )}

          <span style={{ color: '#475569' }}>|</span>

          <span className={`badge badge-${directorMode}`} style={{ fontSize: '0.65rem' }}>
            {directorMode.toUpperCase()}
          </span>

          <span className="badge badge-demo" style={{ fontSize: '0.65rem' }}>
            {privacyMode.toUpperCase()}
          </span>
        </div>

        {/* Live Quality Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: '#94A3B8' }}>
          <span>WPM: <strong style={{ color: '#F8FAFC' }}>{estimatedWpm || '—'}</strong></span>
          <span>Fillers: <strong style={{ color: fillerWordCount > 3 ? '#F87171' : '#F8FAFC' }}>{fillerWordCount}</strong></span>
          <span>Audio: <strong style={{ color: audioMetrics.isClipping ? '#EF4444' : '#22C55E' }}>{audioMetrics.decibels} dB</strong></span>
          {isAiLoading && (
            <span style={{ color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={13} /> AI Evaluating...
            </span>
          )}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="studio-grid">
        {/* Left Area: Camera Preview & Floating Overlay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="camera-preview-wrapper" style={{ position: 'relative' }}>
            <video
              ref={videoElementRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />

            {/* Rule of Thirds Grid Lines Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr'
              }}
            >
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.07)', borderBottom: '1px dashed rgba(255,255,255,0.07)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.07)', borderBottom: '1px dashed rgba(255,255,255,0.07)' }} />
              <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.07)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.07)', borderBottom: '1px dashed rgba(255,255,255,0.07)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.07)', borderBottom: '1px dashed rgba(255,255,255,0.07)' }} />
              <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.07)' }} />
            </div>

            {/* Face Target Framing Guide */}
            <div
              style={{
                position: 'absolute',
                top: '22%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '180px',
                height: '210px',
                border: `2px solid ${visionMetrics.framing.status === 'OPTIMAL' ? '#22C55E' : '#F59E0B'}`,
                borderRadius: '12px',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                background: visionMetrics.framing.status === 'OPTIMAL' ? 'rgba(34, 197, 94, 0.03)' : 'rgba(245, 158, 11, 0.05)'
              }}
            >
              <span style={{ fontSize: '0.6875rem', color: visionMetrics.framing.status === 'OPTIMAL' ? '#86EFAC' : '#FDE68A', fontWeight: 600 }}>
                {visionMetrics.framing.status === 'OPTIMAL' ? 'Optimal Headroom' : visionMetrics.framing.status}
              </span>
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)' }}>Center Face Lock</span>
            </div>

            {/* Active Director Alert Pill (Animated at top) */}
            {activeNote && (
              <div className={`director-alert-pill director-alert-${activeNote.severity}`}>
                <Eye size={18} />
                <div>
                  <strong>{activeNote.message}</strong>
                  {activeNote.action && (
                    <span style={{ marginLeft: '6px', opacity: 0.9 }}>— {activeNote.action}</span>
                  )}
                </div>
              </div>
            )}

            {/* Bottom In-Frame Status Bar */}
            <div
              style={{
                position: 'absolute',
                bottom: '14px',
                left: '16px',
                right: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(16, 19, 24, 0.75)',
                padding: '6px 14px',
                borderRadius: '8px',
                backdropFilter: 'blur(8px)',
                fontSize: '0.75rem',
                color: '#94A3B8'
              }}
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>Light: <strong style={{ color: visionMetrics.luminanceClassification === 'LOW_LIGHT' ? '#F87171' : '#F8FAFC' }}>{visionMetrics.luminanceClassification}</strong></span>
                <span>Focus: <strong style={{ color: visionMetrics.isBlurry ? '#F87171' : '#F8FAFC' }}>{visionMetrics.isBlurry ? 'Soft' : 'Sharp'}</strong></span>
                <span>Clip Count: <strong style={{ color: clippingEventsCount > 0 ? '#EF4444' : '#F8FAFC' }}>{clippingEventsCount}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
                <span style={{ color: '#86EFAC', fontWeight: 500 }}>Live Vision Engine</span>
              </div>
            </div>
          </div>

          {/* Control Bar Under Camera */}
          <div
            style={{
              background: 'var(--studio-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.85rem 1.25rem',
              border: '1px solid var(--studio-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            {/* Primary Recording Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {!isRecording ? (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleStartRecording}
                  style={{ background: '#EF4444' }}
                >
                  <Video size={18} /> Start Recording
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={handleTogglePause}
                  >
                    {isPaused ? <Play size={18} /> : <Pause size={18} />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>

                  <button
                    className="btn btn-danger btn-lg"
                    onClick={handleStopRecording}
                  >
                    <Square size={18} /> Finish Take
                  </button>

                  <button
                    className="btn btn-dark"
                    onClick={handleRestartTake}
                    title="Restart current take"
                  >
                    <RotateCcw size={16} /> Restart Take
                  </button>
                </>
              )}
            </div>

            {/* Utility Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className={`btn ${micMuted ? 'btn-danger' : 'btn-dark'}`}
                onClick={handleToggleMic}
                title={micMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {micMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                className={`btn ${teleprompterVisible ? 'btn-primary' : 'btn-dark'}`}
                onClick={() => setTeleprompterVisible(!teleprompterVisible)}
              >
                <FileText size={16} /> {teleprompterVisible ? 'Hide Prompter' : 'Show Prompter'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Tabs for Teleprompter, Transcript, Metrics, Notes */}
        {teleprompterVisible && (
          <div
            style={{
              background: 'var(--studio-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--studio-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--studio-border)', background: 'var(--studio-surface-elevated)' }}>
              <button
                onClick={() => setActiveRightTab('teleprompter')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: activeRightTab === 'teleprompter' ? '#60A5FA' : '#94A3B8',
                  borderBottom: activeRightTab === 'teleprompter' ? '2px solid #3B82F6' : 'none'
                }}
              >
                Script ({sections.length})
              </button>
              <button
                onClick={() => setActiveRightTab('transcript')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: activeRightTab === 'transcript' ? '#60A5FA' : '#94A3B8',
                  borderBottom: activeRightTab === 'transcript' ? '2px solid #3B82F6' : 'none'
                }}
              >
                Transcript
              </button>
              <button
                onClick={() => setActiveRightTab('metrics')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: activeRightTab === 'metrics' ? '#60A5FA' : '#94A3B8',
                  borderBottom: activeRightTab === 'metrics' ? '2px solid #3B82F6' : 'none'
                }}
              >
                Signals
              </button>
              <button
                onClick={() => setActiveRightTab('notes')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: activeRightTab === 'notes' ? '#60A5FA' : '#94A3B8',
                  borderBottom: activeRightTab === 'notes' ? '2px solid #3B82F6' : 'none'
                }}
              >
                Notes ({notesHistory.length})
              </button>
            </div>

            {/* TAB 1: TELEPROMPTER */}
            {activeRightTab === 'teleprompter' && (
              <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {sections.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                    <p>No script loaded.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>Freestyle take active.</p>
                  </div>
                ) : (
                  sections.map((sec, idx) => {
                    const isCurrent = idx === currentSectionIndex;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => setCurrentSectionIndex(idx)}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '8px',
                          background: isCurrent ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${isCurrent ? '#3B82F6' : '#2D3748'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isCurrent ? '#60A5FA' : sec.completed ? '#4ADE80' : '#E2E8F0' }}>
                            {idx + 1}. {sec.title}
                          </span>
                          {sec.completed ? (
                            <span style={{ fontSize: '0.7rem', color: '#4ADE80', fontWeight: 600 }}>✓ COMPLETED</span>
                          ) : isCurrent ? (
                            <span style={{ fontSize: '0.7rem', color: '#60A5FA', fontWeight: 600 }}>LIVE NOW</span>
                          ) : null}
                        </div>

                        <p style={{ fontSize: '0.875rem', color: isCurrent ? '#F8FAFC' : '#94A3B8', lineHeight: 1.45 }}>
                          {sec.content}
                        </p>

                        {/* Keyword progress meter */}
                        <div style={{ marginTop: '8px', height: '3px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.round(sec.progress * 100)}%`,
                              background: '#3B82F6',
                              transition: 'width 200ms ease'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: LIVE TRANSCRIPT & MANUAL FALLBACK */}
            {activeRightTab === 'transcript' && (
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Spoken Transcript
                  </span>
                  {!speechSupported && (
                    <span style={{ fontSize: '0.7rem', color: '#F59E0B' }}>Web Speech API unavailable (Manual active)</span>
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    background: '#101318',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    border: '1px solid #2D3748',
                    overflowY: 'auto',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    color: '#F8FAFC',
                    minHeight: '220px',
                    marginBottom: '1rem'
                  }}
                >
                  {transcript ? (
                    <>
                      <span>{transcript}</span>
                      {interimText && <span style={{ color: '#60A5FA', fontStyle: 'italic' }}> {interimText}</span>}
                    </>
                  ) : (
                    <span style={{ color: '#475569' }}>
                      {isRecording ? 'Listening for speech input...' : 'Start recording to begin live transcription.'}
                    </span>
                  )}
                </div>

                {/* Manual transcript fallback input */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px', display: 'block' }}>
                    Manual Speech / Key Talking Points Fallback:
                  </label>
                  <textarea
                    className="form-textarea"
                    style={{ background: '#101318', borderColor: '#2D3748', color: '#F8FAFC', minHeight: '80px', fontSize: '0.8125rem' }}
                    placeholder="If mic transcription is unsupported, type or paste spoken points here..."
                    value={transcript}
                    onChange={e => updateManualTranscript(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: SIGNALS & METRICS */}
            {activeRightTab === 'metrics' && (
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                <div style={{ background: '#101318', padding: '0.85rem', borderRadius: '8px', border: '1px solid #2D3748' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Face Framing & Center</span>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: visionMetrics.framing.status === 'OPTIMAL' ? '#4ADE80' : '#F59E0B', marginTop: '4px' }}>
                    {visionMetrics.framing.message}
                  </div>
                </div>

                <div style={{ background: '#101318', padding: '0.85rem', borderRadius: '8px', border: '1px solid #2D3748' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Average Luminance Exposure</span>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', marginTop: '4px' }}>
                    {visionMetrics.averageLuminance} / 255 ({visionMetrics.luminanceClassification})
                  </div>
                </div>

                <div style={{ background: '#101318', padding: '0.85rem', borderRadius: '8px', border: '1px solid #2D3748' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Audio RMS Decibel Level</span>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: audioMetrics.isClipping ? '#EF4444' : '#4ADE80', marginTop: '4px' }}>
                    {audioMetrics.decibels} dB {audioMetrics.isClipping && '(CLIPPING)'}
                  </div>
                </div>

                <div style={{ background: '#101318', padding: '0.85rem', borderRadius: '8px', border: '1px solid #2D3748' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Speaking Pace (WPM)</span>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', marginTop: '4px' }}>
                    {estimatedWpm ? `${estimatedWpm} words per minute` : 'Calculating pace...'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DIRECTOR NOTES STREAM */}
            {activeRightTab === 'notes' && (
              <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notesHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                    <MessageSquare size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.85rem' }}>No director alerts recorded yet.</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Director will provide non-intrusive feedback during recording.</p>
                  </div>
                ) : (
                  notesHistory.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        background: note.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${note.severity === 'critical' ? '#EF4444' : '#334155'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: note.severity === 'critical' ? '#F87171' : '#60A5FA' }}>
                          {note.type} • {note.severity}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#F8FAFC', marginTop: '2px' }}>
                        {note.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

