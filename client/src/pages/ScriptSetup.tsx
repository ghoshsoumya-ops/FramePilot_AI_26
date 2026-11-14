import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  ArrowRight,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Video
} from 'lucide-react';
import { ApiService, GenerateScriptPayload } from '../services/api.js';
import { StorageService, SavedScript } from '../services/storage.service.js';
import { parseScript, ScriptSection } from '../utils/scriptMatcher.js';
import { useAppStore } from '../store/appStore.js';

export const ScriptSetup: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveScript, activeScript } = useAppStore();

  const [activeTab, setActiveTab] = useState<'paste' | 'generate' | 'freestyle'>('paste');

  // Script editor state
  const [title, setTitle] = useState<string>(activeScript?.title || 'How to Build an Audience in 2026');
  const [category, setCategory] = useState<string>(activeScript?.category || 'Education');
  const [objective, setObjective] = useState<string>(activeScript?.objective || 'Teach creators the 3 core pillars of retention');
  const [rawText, setRawText] = useState<string>(
    activeScript?.rawText ||
`# Hook
Stop scrolling. If you want to grow a loyal audience this year, 90% of what worked in 2023 will actually hurt your channel today.

# Introduction
Welcome back. In this breakdown, we're cutting through the noise and looking at what actually moves the needle for creators right now.

# Main Point 1: Specificity Over Virality
First, stop trying to make content for everyone. When you speak to everybody, nobody feels like you're talking directly to them. Solve one specific problem for one specific viewer.

# Main Point 2: Visual & Audio Retention
Second, you don't need a $4,000 cinema camera, but your audio must be clean and your framing must keep the viewer locked in eye contact.

# Conclusion & Action
Focus on repeatable systems over lucky viral hits. Validate your ideas, track your delivery, and refine every take.

# Call to Action
If this resonated, save this video and drop a comment below with what you're recording this week.`
  );

  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // AI Generator state
  const [topic, setTopic] = useState<string>('Why every creator should master video hooks');
  const [platform, setPlatform] = useState<'youtube' | 'reels' | 'shorts' | 'general'>('youtube');
  const [tone, setTone] = useState<'educational' | 'conversational' | 'professional' | 'entertaining'>('conversational');
  const [duration, setDuration] = useState<'30s' | '60s' | '3m' | '5m'>('60s');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [altHooks, setAltHooks] = useState<string[]>([]);

  // Parse raw text into sections whenever text changes
  useEffect(() => {
    const parsed = parseScript(rawText);
    setSections(parsed);
  }, [rawText]);

  const handleSaveScript = async () => {
    const scriptObj: SavedScript = {
      id: activeScript?.id || `script-${Date.now()}`,
      title,
      category,
      rawText,
      objective,
      updatedAt: Date.now()
    };
    await StorageService.saveScript(scriptObj);
    setActiveScript(scriptObj);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleStartRecording = async () => {
    if (activeTab !== 'freestyle') {
      const scriptObj: SavedScript = {
        id: activeScript?.id || `script-${Date.now()}`,
        title,
        category,
        rawText,
        objective,
        updatedAt: Date.now()
      };
      await StorageService.saveScript(scriptObj);
      setActiveScript(scriptObj);
    } else {
      setActiveScript(null);
    }
    navigate('/setup');
  };

  const handleGenerateScript = async () => {
    try {
      setIsGenerating(true);
      setErrorMsg(null);
      const payload: GenerateScriptPayload = {
        topic,
        platform,
        tone,
        duration
      };
      const res = await ApiService.generateScript(payload);
      setTitle(res.title || topic);
      setAltHooks(res.alternativeHooks || []);

      // Format generated sections into markdown text
      const fullText = res.sections
        .map((s: any) => `# ${s.title}\n${s.content}`)
        .join('\n\n');

      setRawText(fullText);
      setActiveTab('paste'); // switch to editor to review & edit
    } catch (err: any) {
      console.error('Script generation error:', err);
      setErrorMsg(err.message || 'Script generation failed. Please check Gemini API status.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAltHook = (hookText: string) => {
    const lines = rawText.split('\n');
    let replaced = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('hook') && lines[i].startsWith('#')) {
        if (i + 1 < lines.length) {
          lines[i + 1] = hookText;
          replaced = true;
          break;
        }
      }
    }
    if (!replaced) {
      setRawText(`# Hook\n${hookText}\n\n` + rawText);
    } else {
      setRawText(lines.join('\n'));
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', marginBottom: '0.35rem' }}>Script Preparation</h1>
            <p>Structure your script into teleprompter-ready sections with real-time tracking.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {activeTab !== 'freestyle' && (
              <button className="btn btn-secondary" onClick={handleSaveScript}>
                {savedSuccess ? <CheckCircle size={16} color="var(--status-success)" /> : <Save size={16} />}
                {savedSuccess ? 'Saved Locally' : 'Save Script'}
              </button>
            )}
            <button className="btn btn-primary" onClick={handleStartRecording}>
              <Video size={16} /> Proceed to Recording Setup <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* 3 Tabs Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('paste')}
            style={{
              padding: '0.75rem 0.25rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: activeTab === 'paste' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'paste' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={16} /> 1. Paste & Edit Script
          </button>

          <button
            onClick={() => setActiveTab('generate')}
            style={{
              padding: '0.75rem 0.25rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: activeTab === 'generate' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'generate' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={16} /> 2. AI Generate from Topic
          </button>

          <button
            onClick={() => setActiveTab('freestyle')}
            style={{
              padding: '0.75rem 0.25rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: activeTab === 'freestyle' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'freestyle' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Video size={16} /> 3. Continue Without Script
          </button>
        </div>

        {/* TAB 1: PASTE / EDIT SCRIPT */}
        {activeTab === 'paste' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }}>
            <div>
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Script Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. 3 Habits that Changed My Career"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option value="Education">Education</option>
                      <option value="Vlog">Vlog / Story</option>
                      <option value="Tech">Tech / Coding</option>
                      <option value="Business">Business / Finance</option>
                      <option value="Shorts">Shorts / Reels</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Content Objective (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    placeholder="e.g. Keep viewers engaged until the final 3-step action checklist"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label">Script Content (Markdown or plain text)</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Use # for section headers
                    </span>
                  </div>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '340px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder="# Hook&#10;Your attention grabbing opening sentence...&#10;&#10;# Introduction&#10;What you will cover...&#10;&#10;# Main Point 1&#10;Your core takeaway..."
                  />
                </div>
              </div>

              {altHooks.length > 0 && (
                <div className="card" style={{ background: '#FAF5FF', borderColor: '#E9D5FF' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#7E22CE', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={15} /> Alternative Generated Hooks (Click to swap into script)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {altHooks.map((h, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectAltHook(h)}
                        style={{
                          background: '#FFFFFF',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '6px',
                          border: '1px solid #D8B4FE',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: '#4C1D95'
                        }}
                      >
                        "{h}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Parsed Sections Breakdown Preview */}
            <div>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem' }}>Live Teleprompter Sections ({sections.length})</h3>
                  <span className="badge badge-strict" style={{ fontSize: '0.7rem' }}>Auto-Parsed</span>
                </div>
                <p style={{ fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
                  The director uses these sections during recording to track spoken progress and detect skipped points.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto' }}>
                  {sections.map((sec, i) => (
                    <div
                      key={sec.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '8px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {i + 1}. {sec.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {sec.expectedKeywords.length} keywords
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {sec.content.slice(0, 110)}{sec.content.length > 110 ? '...' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI SCRIPT GENERATION */}
        {activeTab === 'generate' && (
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FAF5FF', color: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>AI Script Architect</h3>
                  <p style={{ fontSize: '0.85rem' }}>Generate a high-retention video script structured for natural delivery.</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Video Topic or Core Message</label>
                <input
                  type="text"
                  className="form-input"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Why every college student should learn programming"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Platform</label>
                  <select
                    className="form-select"
                    value={platform}
                    onChange={e => setPlatform(e.target.value as any)}
                  >
                    <option value="youtube">YouTube (Long/Standard)</option>
                    <option value="reels">Instagram Reels</option>
                    <option value="shorts">YouTube Shorts</option>
                    <option value="general">General Video</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tone of Voice</label>
                  <select
                    className="form-select"
                    value={tone}
                    onChange={e => setTone(e.target.value as any)}
                  >
                    <option value="conversational">Conversational</option>
                    <option value="educational">Educational</option>
                    <option value="professional">Professional</option>
                    <option value="entertaining">Entertaining</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Target Duration</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {(['30s', '60s', '3m', '5m'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      className={`btn ${duration === d ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setDuration(d)}
                      style={{ padding: '0.5rem' }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
                onClick={handleGenerateScript}
                disabled={isGenerating || !topic.trim()}
              >
                {isGenerating ? (
                  <span>Generating Structured Script...</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} /> Generate Video Script
                  </span>
                )}
              </button>

              {errorMsg && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#B91C1C', fontSize: '0.85rem' }}>
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FREESTYLE / NO SCRIPT */}
        {activeTab === 'freestyle' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div className="card" style={{ padding: '3rem 2rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Video size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Freestyle Recording</h3>
              <p style={{ marginBottom: '1.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Record without a prepared script. The AI Director will focus entirely on your framing, lighting, eye-level lock, audio levels, speaking pace, and filler words.
              </p>
              <button className="btn btn-primary btn-lg" onClick={handleStartRecording}>
                Proceed to Camera Setup <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

