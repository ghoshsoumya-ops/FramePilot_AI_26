import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Lightbulb,
  FileText,
  Sliders,
  Share2
} from 'lucide-react';
import { ApiService, GenerateHooksPayload } from '../services/api.js';

export const ContentTools: React.FC = () => {
  const [topic, setTopic] = useState<string>('Why every creator should learn storytelling');
  const [platform, setPlatform] = useState<'youtube' | 'reels' | 'shorts' | 'general'>('youtube');
  const [audience, setAudience] = useState<string>('Aspiring video creators & educators');
  const [category, setCategory] = useState<string>('Education');
  const [existingOpening, setExistingOpening] = useState<string>('In this video I am going to talk about storytelling techniques.');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setErrorMsg(null);
      const payload: GenerateHooksPayload = {
        topic,
        platform,
        audience,
        category,
        existingOpening
      };
      const data = await ApiService.generateHooks(payload);
      setResult(data);
    } catch (err: any) {
      console.error('Failed to generate hooks:', err);
      setErrorMsg(err.message || 'Failed to generate hooks. Please verify Gemini API status.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.35rem' }}>AI Hook & Content Intelligence</h1>
          <p>
            Engineer high-retention opening hooks, psychological curiosity triggers, and dynamic transitions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* Inputs Column */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={18} color="var(--accent-primary)" /> Video Content Concept
            </h3>

            <div className="form-group">
              <label className="form-label">Core Topic or Lesson</label>
              <input
                type="text"
                className="form-input"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. 3 habits that saved me 20 hours a week"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Target Platform</label>
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
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="Education">Education</option>
                  <option value="Storytelling">Storytelling</option>
                  <option value="Tech">Tech / Coding</option>
                  <option value="Business">Business / Finance</option>
                  <option value="Fitness">Fitness / Health</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience Description</label>
              <input
                type="text"
                className="form-input"
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g. Beginners learning to code in 2026"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Existing Opening Sentence (To Improve)</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '75px' }}
                value={existingOpening}
                onChange={e => setExistingOpening(e.target.value)}
                placeholder="What were you originally planning to say first?"
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
            >
              {isGenerating ? (
                <span>Generating Retention Strategy...</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} /> Generate Retention Hooks
                </span>
              )}
            </button>

            {errorMsg && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#B91C1C', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Quick Rationale / Strategy Guide */}
          <div>
            <div className="card" style={{ background: 'var(--bg-subtle)', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Share2 size={16} color="var(--accent-primary)" /> Hook Psychology Principles
              </h4>
              <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                Viewers decide whether to stay within the first 3 seconds. The goal of a hook is not clickbait; it is setting high cognitive stakes.
              </p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li><strong>Curiosity Gap:</strong> Highlight an unspoken counter-intuitive truth.</li>
                <li><strong>Loss Aversion:</strong> Warn against the common mistake 90% of people make.</li>
                <li><strong>Time Compression:</strong> Promise a rapid framework or blueprint.</li>
              </ul>
            </div>

            {result && result.rationale && (
              <div className="card" style={{ background: '#FAF5FF', borderColor: '#E9D5FF' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#7E22CE', marginBottom: '4px' }}>Strategic Rationale</h4>
                <p style={{ fontSize: '0.8125rem', color: '#581C87', lineHeight: 1.45 }}>
                  {result.rationale}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Stream */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 3 Alternative Hooks */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-primary)" /> 3 Engineered Alternative Hooks
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.hooks?.map((hookItem: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="badge badge-strict" style={{ fontSize: '0.7rem' }}>
                        {hookItem.style}
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopy(hookItem.hook, `hook-${idx}`)}
                      >
                        {copiedKey === `hook-${idx}` ? <Check size={14} color="green" /> : <Copy size={14} />}
                        {copiedKey === `hook-${idx}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      "{hookItem.hook}"
                    </p>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <strong>Why it works:</strong> {hookItem.whyItWorks}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stronger Opening & Structure Beats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Stronger Opening Line */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem' }}>Refined Opening Sentence</h4>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(result.strongerOpeningSentence, 'opening')}
                  >
                    {copiedKey === 'opening' ? <Check size={14} color="green" /> : <Copy size={14} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '6px' }}>
                  "{result.strongerOpeningSentence}"
                </p>
              </div>

              {/* Recommended Call to Action */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem' }}>High-Conversion Call to Action</h4>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(result.callToActionSuggestion, 'cta')}
                  >
                    {copiedKey === 'cta' ? <Check size={14} color="green" /> : <Copy size={14} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '6px' }}>
                  "{result.callToActionSuggestion}"
                </p>
              </div>
            </div>

            {/* Transitions & Pacing Structure */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="card">
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Suggested Content Beat Structure</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.suggestedStructure?.map((beat: string, i: number) => (
                    <div key={i} style={{ fontSize: '0.85rem', padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
                      {beat}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Seamless Verbal Transitions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.transitions?.map((trans: string, i: number) => (
                    <div key={i} style={{ fontSize: '0.85rem', padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>"{trans}"</span>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleCopy(trans, `trans-${i}`)}
                        style={{ padding: '2px 6px' }}
                      >
                        {copiedKey === `trans-${i}` ? <Check size={12} color="green" /> : <Copy size={12} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

