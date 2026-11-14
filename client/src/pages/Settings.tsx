import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Database,
  Trash2,
  Cpu,
  CheckCircle2,
  Server
} from 'lucide-react';
import { useAppStore, DirectorMode, PrivacyMode } from '../store/appStore.js';
import { ApiService } from '../services/api.js';

export const Settings: React.FC = () => {
  const {
    directorMode,
    setDirectorMode,
    privacyMode,
    setPrivacyMode,
    hasFrameConsent,
    setHasFrameConsent
  } = useAppStore();

  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number }>({ usage: 0, quota: 0 });
  const [clearSuccess, setClearSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check backend health
    ApiService.getHealth()
      .then(res => setBackendHealth(res))
      .catch(() => setBackendHealth({ status: 'offline', mockMode: true }));

    // Check browser storage estimate
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(est => {
        setStorageEstimate({
          usage: Math.round((est.usage || 0) / (1024 * 1024)),
          quota: Math.round((est.quota || 0) / (1024 * 1024))
        });
      });
    }
  }, []);

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to clear all locally saved scripts, takes, and reports? This cannot be undone.')) {
      try {
        const dbs = await window.indexedDB.databases?.();
        if (dbs) {
          for (const db of dbs) {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          }
        }
        localStorage.clear();
        setClearSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error('Failed to clear IndexedDB:', err);
      }
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.35rem' }}>Settings & System Status</h1>
          <p>Manage application preferences, privacy boundaries, and inspect backend AI connectivity.</p>
        </div>

        {/* Backend & AI Connectivity */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="var(--accent-primary)" /> Backend & Gemini AI Engine
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Server Status</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: backendHealth?.status === 'ok' ? 'var(--status-success)' : 'var(--status-danger)', marginTop: '2px' }}>
                {backendHealth?.status === 'ok' ? '● Online & Healthy' : 'Offline / Checking'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Execution Engine</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>
                {backendHealth?.mockMode ? (
                  <span className="badge badge-demo">Demo AI Engine (Deterministic MOCK_LLM)</span>
                ) : (
                  <span className="badge badge-live">Live Google Gemini API</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Configured Models: <code>Live: {backendHealth?.models?.live || 'gemini-3.5-flash-lite'}</code> | <code>Report: {backendHealth?.models?.report || 'gemini-3.5-flash'}</code> | <code>Content: {backendHealth?.models?.content || 'gemini-3.5-flash'}</code>
          </div>
        </div>

        {/* Default Director Mode */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent-primary)" /> Default Director Behavior
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(['strict', 'flexible', 'coach'] as DirectorMode[]).map(mode => (
              <label
                key={mode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${directorMode === mode ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background: directorMode === mode ? 'var(--accent-light)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="defaultMode"
                  checked={directorMode === mode}
                  onChange={() => setDirectorMode(mode)}
                />
                <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.9rem' }}>
                  {mode} Mode
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Privacy & Storage */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--status-success)" /> Browser Storage & Local Data
          </h3>

          <p style={{ fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            All video recordings, session histories, scripts, and reports are saved exclusively in your browser's IndexedDB. FramePilot does not utilize remote customer tracking databases.
          </p>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Browser Storage Used:</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {storageEstimate.usage} MB <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/ {storageEstimate.quota} MB available</span>
            </div>
          </div>

          <button
            className="btn btn-danger"
            onClick={handleClearAllData}
          >
            <Trash2 size={16} /> Clear All Local Sessions & Data
          </button>
          {clearSuccess && (
            <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: 'var(--status-success)' }}>
              Data cleared. Reloading...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

