import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Camera,
  Mic,
  Shield,
  Sliders,
  FileText,
  Video,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Eye,
  Sparkles
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera.js';
import { useAudioMonitor } from '../hooks/useAudioMonitor.js';
import { useAppStore, DirectorMode, PrivacyMode } from '../store/appStore.js';

export const RecordingSetup: React.FC = () => {
  const navigate = useNavigate();
  const {
    directorMode,
    setDirectorMode,
    privacyMode,
    setPrivacyMode,
    hasFrameConsent,
    setHasFrameConsent,
    activeScript,
    selectedCameraId,
    setSelectedCameraId,
    selectedMicId,
    setSelectedMicId
  } = useAppStore();

  const {
    stream,
    devices,
    permissionError,
    startCamera,
    stopCamera,
    videoElementRef
  } = useCamera();

  const { metrics: audioMetrics } = useAudioMonitor(stream);

  // Initialize camera preview on mount
  useEffect(() => {
    startCamera(selectedCameraId || undefined);
    return () => stopCamera();
  }, [selectedCameraId]);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const devId = e.target.value;
    setSelectedCameraId(devId);
    startCamera(devId);
  };

  const handleLaunchStudio = () => {
    navigate('/studio');
  };

  return (
    <div style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.35rem' }}>Director Setup & Calibration</h1>
          <p>Configure your devices, calibrate audio/video, and set your director behavior.</p>
        </div>

        {permissionError && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '1.5rem'
            }}
          >
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{permissionError}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2rem' }}>
          {/* Left Column: Camera Preview & Audio Test */}
          <div>
            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} /> Camera Feed Preview
                </span>
                <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>
                  Live Signal
                </span>
              </div>

              {/* Video Preview Box */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  background: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <video
                  ref={videoElementRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />

                {/* Framing Target Box */}
                <div
                  style={{
                    position: 'absolute',
                    width: '150px',
                    height: '180px',
                    border: '1px dashed rgba(255, 255, 255, 0.4)',
                    borderRadius: '8px',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>Face Center Target</span>
                </div>
              </div>

              {/* Device Selector */}
              <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Select Camera</label>
                <select
                  className="form-select"
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                >
                  {devices.length > 0 ? (
                    devices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))
                  ) : (
                    <option value="">Default System Camera</option>
                  )}
                </select>
              </div>
            </div>

            {/* Audio Level Test Meter */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mic size={16} /> Microphone Calibration Test
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {audioMetrics.decibels} dB
                </span>
              </div>

              {/* Visual meter bar */}
              <div style={{ height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round(audioMetrics.rmsLevel * 250))}%`,
                    background: audioMetrics.isClipping ? 'var(--status-danger)' : audioMetrics.rmsLevel > 0.05 ? 'var(--status-success)' : 'var(--accent-primary)',
                    transition: 'width 80ms ease'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span>-60 dB (Silent)</span>
                <span>-12 dB (Optimal Voice)</span>
                <span>0 dB (Clipping)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Modes & Privacy Settings */}
          <div>
            {/* Director Mode Selector */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Sliders size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.05rem' }}>Director Mode</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Strict Mode */}
                <div
                  onClick={() => setDirectorMode('strict')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: `2px solid ${directorMode === 'strict' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: directorMode === 'strict' ? 'var(--accent-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>STRICT MODE</span>
                    {directorMode === 'strict' && <CheckCircle size={16} color="var(--accent-primary)" />}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    High script fidelity. Flags missing bullet points, skipped takeaways, and script drift immediately.
                  </p>
                </div>

                {/* Flexible Mode */}
                <div
                  onClick={() => setDirectorMode('flexible')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: `2px solid ${directorMode === 'flexible' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: directorMode === 'flexible' ? 'var(--accent-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>FLEXIBLE MODE (Recommended)</span>
                    {directorMode === 'flexible' && <CheckCircle size={16} color="var(--accent-primary)" />}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    For vloggers & conversational content. Allows ad-libbing while watching visual framing, lighting, and core structure.
                  </p>
                </div>

                {/* Coach Mode */}
                <div
                  onClick={() => setDirectorMode('coach')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: `2px solid ${directorMode === 'coach' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: directorMode === 'coach' ? 'var(--accent-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>COACH MODE</span>
                    {directorMode === 'coach' && <CheckCircle size={16} color="var(--accent-primary)" />}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Focuses on delivery skills. Monitors speaking pace (WPM), long awkward pauses, and excessive filler words.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                <Shield size={18} color="var(--status-success)" />
                <h3 style={{ fontSize: '1.05rem' }}>Privacy & Data Controls</h3>
              </div>
              <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                All recordings remain in your browser. We never transmit full video streams externally.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="privacyMode"
                    value="local"
                    checked={privacyMode === 'local'}
                    onChange={() => setPrivacyMode('local')}
                  />
                  <span><strong>1. Local-Only Mode:</strong> 100% on-device vision & audio (zero external API calls).</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="privacyMode"
                    value="transcript-only"
                    checked={privacyMode === 'transcript-only'}
                    onChange={() => setPrivacyMode('transcript-only')}
                  />
                  <span><strong>2. Transcript-Only Mode:</strong> Sends spoken words to AI; never sends camera frames.</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="privacyMode"
                    value="ai-assisted"
                    checked={privacyMode === 'ai-assisted'}
                    onChange={() => setPrivacyMode('ai-assisted')}
                  />
                  <span><strong>3. AI-Assisted Mode:</strong> Escalates selected downscaled frames and text to Gemini.</span>
                </label>
              </div>

              {/* Explicit Consent Checkbox (Default false) */}
              {privacyMode === 'ai-assisted' && (
                <div style={{ background: '#FFFBEB', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FDE68A', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8125rem', color: '#92400E', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasFrameConsent}
                      onChange={e => setHasFrameConsent(e.target.checked)}
                      style={{ marginTop: '2px' }}
                    />
                    <span>
                      I explicitly consent to transmitting occasional downscaled camera keyframes (max 512px) to the Gemini backend for visual coaching analysis.
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Active Script Preview */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {activeScript ? activeScript.title : 'No script loaded (Freestyle Mode)'}
                  </span>
                </div>
                <Link to="/script" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                  {activeScript ? 'Change Script' : 'Add Script'}
                </Link>
              </div>
            </div>

            {/* Launch Studio Action */}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '0.85rem' }}
              onClick={handleLaunchStudio}
            >
              <Video size={18} /> Launch Director Studio <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

