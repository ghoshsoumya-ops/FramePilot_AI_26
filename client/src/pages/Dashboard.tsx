import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  FileText,
  Sparkles,
  UploadCloud,
  Clock,
  Award,
  ArrowRight,
  Trash2,
  PlayCircle
} from 'lucide-react';
import { StorageService, RecordingSession } from '../services/storage.service.js';
import { useAppStore } from '../store/appStore.js';

export const Dashboard: React.FC = () => {
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { setLastReport, setLastRecordedBlobUrl } = useAppStore();

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await StorageService.getAllSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load recording sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this recording session and its local analysis?')) {
      await StorageService.deleteSession(id);
      await loadSessions();
    }
  };

  // Compute actual metrics from locally stored sessions
  const totalTakes = sessions.length;
  const avgScore = totalTakes > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.overallScore, 0) / totalTakes)
    : 0;
  const lastSession = sessions.length > 0 ? sessions[0] : null;

  return (
    <div style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container">
        {/* Welcome Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', marginBottom: '0.35rem' }}>Creator Studio Dashboard</h1>
            <p>Your recording workspace, take histories, and performance analytics.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/script" className="btn btn-secondary">
              <FileText size={16} /> Prepare Script
            </Link>
            <Link to="/setup" className="btn btn-primary">
              <Video size={16} /> Start New Recording
            </Link>
          </div>
        </div>

        {/* Real Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="card">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Takes Recorded
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
              {totalTakes}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {totalTakes === 0 ? 'No takes yet' : 'Stored locally in browser'}
            </span>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Performance Score
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: avgScore >= 80 ? 'var(--status-success)' : avgScore >= 60 ? 'var(--status-warning)' : 'var(--text-primary)', marginTop: '0.35rem' }}>
              {totalTakes > 0 ? `${avgScore}/100` : '—'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {totalTakes > 0 ? 'Delivery & technical aggregate' : 'Complete a take to score'}
            </span>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Last Session Result
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lastSession ? `${lastSession.overallScore}/100 • ${lastSession.scriptTitle || 'Freestyle Take'}` : 'No sessions yet'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {lastSession ? new Date(lastSession.createdAt).toLocaleDateString() : 'Awaiting first take'}
            </span>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <Link to="/script" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'border-color 0.2s', borderColor: 'var(--border-color)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '2px' }}>Prepare / AI Generate Script</h4>
                <p style={{ fontSize: '0.8rem' }}>Create teleprompter sections & hooks</p>
              </div>
            </div>
          </Link>

          <Link to="/content-tools" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'border-color 0.2s', borderColor: 'var(--border-color)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FAF5FF', color: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '2px' }}>AI Hook Intelligence</h4>
                <p style={{ fontSize: '0.8rem' }}>Generate 3 retention-engineered hooks</p>
              </div>
            </div>
          </Link>

          <Link to="/upload-analysis" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'border-color 0.2s', borderColor: 'var(--border-color)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', color: '#16865B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UploadCloud size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '2px' }}>Analyze Uploaded Video</h4>
                <p style={{ fontSize: '0.8rem' }}>Extract keyframes for AI review</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Recording Sessions List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Recent Recording Takes</h2>
            {sessions.length > 0 && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {sessions.length} take{sessions.length === 1 ? '' : 's'} recorded
              </span>
            )}
          </div>

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p>Loading session history...</p>
            </div>
          ) : sessions.length === 0 ? (
            /* Clear, helpful empty state as required */
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#FFFFFF' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--text-secondary)' }}>
                <Video size={26} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>No recording takes yet</h3>
              <p style={{ maxWidth: '440px', margin: '0 auto 1.75rem', fontSize: '0.9rem' }}>
                Set up your camera, choose a director mode, and record your first take with real-time framing, lighting, and script tracking.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <Link to="/script" className="btn btn-secondary">
                  <FileText size={15} /> Write Script First
                </Link>
                <Link to="/setup" className="btn btn-primary">
                  <Video size={15} /> Start First Take
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, transform 0.15s'
                  }}
                  onClick={() => {
                    setLastReport(session.reportData);
                    if (session.videoBlobUrl) setLastRecordedBlobUrl(session.videoBlobUrl);
                    window.location.href = `/report?id=${session.id}`;
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '8px',
                        background: session.overallScore >= 80 ? '#ECFDF5' : session.overallScore >= 65 ? '#FFFBEB' : '#FEF2F2',
                        color: session.overallScore >= 80 ? '#16865B' : session.overallScore >= 65 ? '#D99124' : '#D84B4B',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        lineHeight: 1
                      }}
                    >
                      {session.overallScore}
                      <span style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/100</span>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {session.scriptTitle || 'Freestyle Recording Take'}
                        </h4>
                        <span className={`badge badge-${session.mode}`} style={{ fontSize: '0.65rem' }}>
                          {session.mode}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} /> {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                        </span>
                        <span>•</span>
                        <span>{new Date(session.createdAt).toLocaleDateString()} {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{session.notesCount} director notes</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      title="Delete take"
                    >
                      <Trash2 size={14} color="#D84B4B" />
                    </button>
                    <Link
                      to={`/report?id=${session.id}`}
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setLastReport(session.reportData);
                        if (session.videoBlobUrl) setLastRecordedBlobUrl(session.videoBlobUrl);
                      }}
                    >
                      View Report <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

