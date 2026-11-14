import React from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  ArrowRight,
  Eye,
  FileCheck2,
  Volume2,
  BarChart3,
  Sparkles,
  Shield,
  Layers,
  CheckCircle2,
  Sliders
} from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Hero Section */}
      <section style={{ padding: '4.5rem 0 3.5rem', background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F8FA 100%)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '880px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: '#EFF6FF',
              color: '#2563EB',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              border: '1px solid #DBEAFE'
            }}
          >
            <Sparkles size={14} /> The Agentic Video Director for Creators
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', lineHeight: 1.15, fontWeight: 700, marginBottom: '1.25rem', color: '#17191C' }}>
            Your Personal AI Director. <br />
            <span style={{ color: '#2563EB' }}>While You Record.</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: '#69717D', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '720px', margin: '0 auto 2.25rem' }}>
            FramePilot watches, listens, and guides you through every take — helping you nail framing, lighting, pacing, and script delivery without needing a professional production team.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/setup" className="btn btn-primary btn-lg">
              <Video size={18} /> Start Recording Take <ArrowRight size={16} />
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              Explore Director Capabilities
            </a>
          </div>
        </div>

        {/* Hero Product Interface Preview */}
        <div className="container" style={{ marginTop: '3.5rem', maxWidth: '1060px' }}>
          <div
            style={{
              background: '#101318',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid #2D3748',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Workspace Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222934', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: '#F8FAFC', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.05em' }}>REC — 00:01:24</span>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>• TAKE 2</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-strict" style={{ fontSize: '0.7rem' }}>Strict Mode</span>
                <span className="badge badge-live" style={{ fontSize: '0.7rem' }}>Local Vision Active</span>
              </div>
            </div>

            {/* Split Preview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '1rem' }}>
              {/* Simulated Camera Window */}
              <div
                style={{
                  background: '#191E26',
                  borderRadius: '10px',
                  minHeight: '340px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #2D3748',
                  overflow: 'hidden'
                }}
              >
                {/* Rule of thirds framing lines */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
                  <div style={{ borderRight: '1px dashed rgba(255,255,255,0.08)', borderBottom: '1px dashed rgba(255,255,255,0.08)' }} />
                  <div style={{ borderRight: '1px dashed rgba(255,255,255,0.08)', borderBottom: '1px dashed rgba(255,255,255,0.08)' }} />
                  <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)' }} />
                  <div style={{ borderRight: '1px dashed rgba(255,255,255,0.08)', borderBottom: '1px dashed rgba(255,255,255,0.08)' }} />
                  <div style={{ borderRight: '1px dashed rgba(255,255,255,0.08)', borderBottom: '1px dashed rgba(255,255,255,0.08)' }} />
                  <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)' }} />
                </div>

                {/* Face Framing Target Box */}
                <div
                  style={{
                    width: '160px',
                    height: '190px',
                    border: '2px solid #22C55E',
                    borderRadius: '8px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(34, 197, 94, 0.04)'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 600 }}>Optimal Eye-Line</span>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>Center-Third Lock</span>
                </div>

                {/* Director Floating Suggestion Pill */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    background: 'rgba(37, 99, 235, 0.92)',
                    color: '#FFFFFF',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <Eye size={15} />
                  <span>Great hook delivery! Now slow pace by 10% for the main point.</span>
                </div>

                {/* Bottom stats overlay */}
                <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                  <span>Pacing: 135 WPM (Optimal)</span>
                  <span>Audio: -12 dB (Crisp)</span>
                  <span>Lighting: Balanced</span>
                </div>
              </div>

              {/* Right Teleprompter & Live Notes Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ background: '#191E26', borderRadius: '10px', padding: '1rem', border: '1px solid #2D3748', flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live Script Teleprompter
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '6px' }}>
                    ✓ 1. Attention-Grabbing Hook
                  </div>
                  <div style={{ fontSize: '0.9375rem', color: '#60A5FA', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', padding: '6px 8px', borderRadius: '6px', marginBottom: '6px', borderLeft: '3px solid #3B82F6' }}>
                    ▶ 2. Core Problem Breakdown
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', lineHeight: 1.4, paddingLeft: '8px' }}>
                    "The reason 90% of creators struggle with drop-off isn't gear—it's front-loading information before establishing the stake..."
                  </p>
                  <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '8px' }}>
                    ○ 3. The 3-Step Solution Framework
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '6px' }}>
                    ○ 4. Closing Call to Action
                  </div>
                </div>

                <div style={{ background: '#191E26', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid #2D3748', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Take Quality Score</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#22C55E' }}>92 / 100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" style={{ padding: '5rem 0', background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Three Pillars of AI Direction</h2>
            <p>Every tool helps you write or edit. FramePilot is the first assistant designed to help while you are actually in front of the lens.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            <div className="card">
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Eye size={22} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>1. Real-Time Visual & Framing Coach</h3>
              <p style={{ lineHeight: 1.6 }}>
                Local computer vision detects face alignment, eye-level headroom, backlight overexposure, underexposure, and soft camera focus in real-time.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#ECFDF5', color: '#16865B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <FileCheck2 size={22} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>2. Intelligent Script & Teleprompter Tracking</h3>
              <p style={{ lineHeight: 1.6 }}>
                Fuzzy script matching listens to what you speak, tracks progress through talking points, warns of script drift, and flags skipped takeaways.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FAF5FF', color: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Volume2 size={22} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>3. Real-Time Audio & Delivery Analytics</h3>
              <p style={{ lineHeight: 1.6 }}>
                Continuous Web Audio RMS calculation catches microphone clipping before ruined takes, tracks speaking pace (WPM), and counts filler words.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FFFBEB', color: '#D99124', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <BarChart3 size={22} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>4. Post-Take Executive Performance Review</h3>
              <p style={{ lineHeight: 1.6 }}>
                Instant score out of 100 with transparent breakdown across Delivery, Technical, Script Fidelity, and Audio, plus targeted retake suggestions.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FEF2F2', color: '#D84B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>5. AI Hook & Content Intelligence</h3>
              <p style={{ lineHeight: 1.6 }}>
                Generate high-retention alternative hooks, psychological triggers, and punchy transitions tailored for YouTube, Reels, and Shorts.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F3F4F6', color: '#17191C', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Shield size={22} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Privacy-First Local Processing</h3>
              <p style={{ lineHeight: 1.6 }}>
                Video is recorded locally in your browser. Vision and audio run on-device. AI mode only transmits compressed keyframes upon explicit consent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>How FramePilot Works</h2>
            <p>From blank canvas to publish-ready take in four straightforward steps.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#2563EB', marginBottom: '0.5rem' }}>01</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Prepare Your Script</h4>
              <p style={{ fontSize: '0.875rem' }}>Paste your script or let the Gemini content architect generate structured, hook-optimized talking points.</p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#2563EB', marginBottom: '0.5rem' }}>02</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Configure Director Setup</h4>
              <p style={{ fontSize: '0.875rem' }}>Select camera & mic, choose director strictness (Strict, Flexible, or Coach), and review privacy controls.</p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#2563EB', marginBottom: '0.5rem' }}>03</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Record with Live Guidance</h4>
              <p style={{ fontSize: '0.875rem' }}>Observe the teleprompter while the director watches your framing, detects pauses, and gives non-intrusive tips.</p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#2563EB', marginBottom: '0.5rem' }}>04</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Review Take & Export</h4>
              <p style={{ fontSize: '0.875rem' }}>Review deterministic scores, analyze weak moments, re-record stumbled sections, or export report data.</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link to="/setup" className="btn btn-primary btn-lg">
              Launch Director Studio Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

