import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Video,
  FileText,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Volume2,
  Eye,
  Sliders,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { StorageService, RecordingSession } from '../services/storage.service.js';
import { useAppStore } from '../store/appStore.js';

export const AnalysisReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('id');

  const { lastReport, lastRecordedBlobUrl, setActiveScript } = useAppStore();
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      if (sessionId) {
        const found = await StorageService.getSessionById(sessionId);
        if (found) {
          setSession(found);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [sessionId]);

  const report = session?.reportData || lastReport;
  const videoUrl = session?.videoBlobUrl || lastRecordedBlobUrl;

  // Handle Exports
  const handleExportJson = () => {
    if (report) {
      StorageService.exportJson(report, `framepilot-report-${sessionId || 'take'}.json`);
    }
  };

  const handleExportNotesCsv = () => {
    if (report?.directorNotesChronological) {
      StorageService.exportNotesCsv(report.directorNotesChronological, `take-director-notes-${sessionId || 'take'}.csv`);
    }
  };

  const handleExportTranscript = () => {
    const text = session?.transcript || report?.fullTranscript || 'Transcript unavailable';
    StorageService.exportTranscriptTxt(text, `take-transcript-${sessionId || 'take'}.txt`);
  };

  const handleRetakeSection = (sectionTitle: string) => {
    navigate('/setup');
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p>Loading take analysis...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>No Report Available</h2>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Record a take in the studio to generate a detailed video performance report.
        </p>
        <Link to="/setup" className="btn btn-primary">
          <Video size={16} /> Open Studio
        </Link>
      </div>
    );
  }

  const overallScore = report.overallScore ?? 88;
  const catScores = report.categoryScores ?? {
    delivery: 88,
    technical: 90,
    scriptFidelity: 85,
    audioQuality: 92,
    contentStructure: 88
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.875rem' }}>Take Performance Report</h1>
              <span className="badge badge-live">Complete</span>
              {report.isMock && <span className="badge badge-demo">Demo AI Engine</span>}
            </div>
            <p>
              {session?.scriptTitle || 'Recording Take'} • {session ? `${Math.floor(session.durationSeconds / 60)}m ${session.durationSeconds % 60}s` : 'Take Review'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportJson}>
              <Download size={14} /> Export JSON
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportNotesCsv}>
              <Download size={14} /> Notes CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportTranscript}>
              <Download size={14} /> Transcript TXT
            </button>
            <Link to="/setup" className="btn btn-primary btn-sm">
              <RotateCcw size={14} /> Record Another Take
            </Link>
          </div>
        </div>

        {/* Top Summary Banner: Overall Score & Individual Category Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Overall Deterministic Score Card */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)'
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overall Take Score
            </span>
            <div
              style={{
                fontSize: '3.75rem',
                fontWeight: 800,
                color: overallScore >= 80 ? 'var(--status-success)' : overallScore >= 65 ? 'var(--status-warning)' : 'var(--status-danger)',
                lineHeight: 1,
                margin: '0.5rem 0'
              }}
            >
              {overallScore}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Out of 100 potential points
            </span>
          </div>

          {/* 5 Categorical Score Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Delivery</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                {catScores.delivery}%
              </div>
              <p style={{ fontSize: '0.7rem', marginTop: '2px' }}>Pacing & pauses</p>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Technical</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                {catScores.technical}%
              </div>
              <p style={{ fontSize: '0.7rem', marginTop: '2px' }}>Framing & light</p>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Script Fidelity</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                {catScores.scriptFidelity}%
              </div>
              <p style={{ fontSize: '0.7rem', marginTop: '2px' }}>Section completion</p>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Audio Quality</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                {catScores.audioQuality}%
              </div>
              <p style={{ fontSize: '0.7rem', marginTop: '2px' }}>Clean headroom</p>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Content Structure</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                {catScores.contentStructure}%
              </div>
              <p style={{ fontSize: '0.7rem', marginTop: '2px' }}>Hook to CTA flow</p>
            </div>
          </div>
        </div>

        {/* Video Playback Player (If available) */}
        {videoUrl && (
          <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={18} /> Recorded Take Playback Preview
            </h3>
            <div style={{ maxWidth: '640px', margin: '0 auto', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
              <video
                src={videoUrl}
                controls
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        )}

        {/* Detailed Breakdown Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Visual Analysis */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} color="var(--accent-primary)" /> Visual Presentation Analysis
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lighting Quality:</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {report.visualAnalysis?.lightingQuality}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Framing & Composition:</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {report.visualAnalysis?.framingQuality}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subject Distance:</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {report.visualAnalysis?.facePositioning}
                </p>
              </div>
            </div>
          </div>

          {/* Audio Analysis */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={18} color="var(--status-success)" /> Audio & Delivery Insights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vocal Level & Presence:</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {report.audioAnalysis?.audioLevel}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Speaking Pace:</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {report.audioAnalysis?.speakingPace}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                <span>Clipping: <strong>{report.audioAnalysis?.clippingEvents || 0}</strong></span>
                <span>Pauses: <strong>{report.audioAnalysis?.longPauses || 0}</strong></span>
                <span>Fillers: <strong>{report.audioAnalysis?.fillerWords || 0}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Script & Performance Feedback */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Script Analysis */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#7E22CE" /> Script Tracking & Key Points
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed Sections:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {report.scriptAnalysis?.completedSections?.map((s: string, i: number) => (
                  <span key={i} className="badge badge-flexible" style={{ fontSize: '0.75rem' }}>
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            {report.scriptAnalysis?.skippedPoints?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Skipped / Rushed Points:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {report.scriptAnalysis?.skippedPoints?.map((s: string, i: number) => (
                    <span key={i} className="badge" style={{ background: '#FEF2F2', color: '#B91C1C', fontSize: '0.75rem' }}>
                      ⚠ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Script Alignment:</span>
              <p style={{ fontSize: '0.875rem', marginTop: '2px' }}>
                {report.scriptAnalysis?.scriptDriftSummary}
              </p>
            </div>
          </div>

          {/* Performance Feedback */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#D99124" /> Delivery Strengths & Improvements
            </h3>

            <div style={{ marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--status-success)', fontWeight: 600 }}>Strong Moments:</span>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '4px', fontSize: '0.85rem' }}>
                {report.performanceFeedback?.strongMoments?.map((m: string, i: number) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#D99124', fontWeight: 600 }}>Key Actionable Improvements:</span>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '4px', fontSize: '0.85rem' }}>
                {report.performanceFeedback?.suggestedImprovements?.map((imp: string, i: number) => (
                  <li key={i}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Retake Recommendations */}
        {report.retakeRecommendations && report.retakeRecommendations.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem', background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#92400E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Recommended Retakes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {report.retakeRecommendations.map((retake: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #FCD34D',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#78350F' }}>
                      {retake.sectionTitle}
                    </span>
                    <p style={{ fontSize: '0.8125rem', color: '#92400E', marginTop: '2px' }}>
                      {retake.reason}
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRetakeSection(retake.sectionTitle)}
                  >
                    Retake This Section <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chronological Director Notes Stream */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} /> Chronological Director Feedback Log
          </h3>

          {report.directorNotesChronological && report.directorNotesChronological.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {report.directorNotesChronological.map((note: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${note.severity === 'critical' ? 'var(--status-danger)' : note.severity === 'important' ? 'var(--status-warning)' : 'var(--accent-primary)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {note.timestamp >= 0 ? `${note.timestamp}s` : 'Live'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {note.message}
                    </span>
                  </div>
                  <span className="badge" style={{ fontSize: '0.65rem' }}>
                    {note.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem' }}>No corrective interruptions were necessary during this take.</p>
          )}
        </div>
      </div>
    </div>
  );
};

