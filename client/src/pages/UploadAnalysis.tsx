import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Video,
  FileText,
  Shield,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Copy,
  Check
} from 'lucide-react';
import { ApiService, AnalyzeUploadPayload } from '../services/api.js';

export const UploadAnalysis: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<'full' | 'visual-only' | 'transcript-only'>('full');
  const [frameConsent, setFrameConsent] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 200MB
    if (file.size > 200 * 1024 * 1024) {
      setErrorMsg('File exceeds 200MB limit. Please select a shorter clip.');
      return;
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setVideoUrl(url);
    setAnalysisResult(null);
  };

  /**
   * Extracts 3-4 downscaled representative keyframes across the video duration using Canvas
   */
  const extractKeyframes = async (video: HTMLVideoElement, count: number = 4): Promise<string[]> => {
    return new Promise((resolve) => {
      const frames: string[] = [];
      const duration = video.duration || 10;
      const step = duration / (count + 1);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const targetWidth = 480;
      const targetHeight = Math.round((video.videoHeight * targetWidth) / (video.videoWidth || 640));
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      let currentIndex = 1;

      const seekNext = () => {
        if (currentIndex <= count) {
          video.currentTime = step * currentIndex;
        } else {
          resolve(frames);
        }
      };

      const handleSeeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          frames.push(canvas.toDataURL('image/jpeg', 0.65));
        }
        currentIndex++;
        seekNext();
      };

      video.addEventListener('seeked', handleSeeked, { once: false });
      seekNext();

      // Safety timeout after 5s
      setTimeout(() => {
        video.removeEventListener('seeked', handleSeeked);
        resolve(frames);
      }, 5000);
    });
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile && analysisMode !== 'transcript-only') {
      setErrorMsg('Please select a video file to analyze.');
      return;
    }

    if (analysisMode !== 'transcript-only' && !frameConsent) {
      setErrorMsg('Explicit consent is required to process video frames for AI analysis.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMsg(null);

      let keyframes: string[] = [];
      if (analysisMode !== 'transcript-only' && videoRef.current) {
        keyframes = await extractKeyframes(videoRef.current, 3);
      }

      const payload: AnalyzeUploadPayload = {
        fileName: selectedFile?.name || 'uploaded_clip.mp4',
        durationSeconds: Math.round(videoRef.current?.duration || 45),
        transcript,
        frames: keyframes,
        analysisMode
      };

      const result = await ApiService.analyzeUpload(payload);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Upload analysis failed:', err);
      setErrorMsg(err.message || 'Analysis failed. Please check connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyHook = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.35rem' }}>Video Upload & AI Review</h1>
          <p>
            Upload a locally recorded video file for framing, lighting, hook, and pacing analysis.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* File Picker & Video Preview */}
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={18} /> Video Source
              </h3>

              {!videoUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--bg-subtle)',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <UploadCloud size={24} />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>Choose a local video file</h4>
                  <p style={{ fontSize: '0.8125rem' }}>MP4, WebM, or MOV up to 200MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      playsInline
                      style={{ width: '100%', maxHeight: '280px', display: 'block' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                      {selectedFile?.name}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setVideoUrl(null);
                        setSelectedFile(null);
                      }}
                    >
                      Change Video
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Transcript Input */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> Spoken Transcript (Optional)
              </h3>
              <p style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                Provide spoken text or talking points for content structure & retention evaluation.
              </p>
              <textarea
                className="form-textarea"
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Paste the transcript or what you spoke during this recording..."
                style={{ minHeight: '110px' }}
              />
            </div>
          </div>

          {/* Configuration & Privacy Controls */}
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} /> Analysis Configuration
              </h3>

              <div className="form-group">
                <label className="form-label">Analysis Mode</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="analysisMode"
                      checked={analysisMode === 'full'}
                      onChange={() => setAnalysisMode('full')}
                    />
                    <span><strong>Full Analysis:</strong> Visual keyframes + Content transcript</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="analysisMode"
                      checked={analysisMode === 'visual-only'}
                      onChange={() => setAnalysisMode('visual-only')}
                    />
                    <span><strong>Visual Presentation Only:</strong> Framing, lighting & stability</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="analysisMode"
                      checked={analysisMode === 'transcript-only'}
                      onChange={() => setAnalysisMode('transcript-only')}
                    />
                    <span><strong>Transcript Only:</strong> Hook, pacing & message structure</span>
                  </label>
                </div>
              </div>

              {/* Privacy Consent Box */}
              {analysisMode !== 'transcript-only' && (
                <div style={{ background: '#FFFBEB', padding: '0.85rem', borderRadius: '8px', border: '1px solid #FDE68A', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400E', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                    <Shield size={16} /> Privacy-Preserving Keyframe Sampling
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#B45309', marginBottom: '8px' }}>
                    The complete video is NOT uploaded. Your browser extracts 3 downscaled (480px) sample frames for analysis.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8125rem', color: '#78350F', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={frameConsent}
                      onChange={e => setFrameConsent(e.target.checked)}
                      style={{ marginTop: '2px' }}
                    />
                    <span>I explicitly consent to sending 3 downscaled keyframes for AI review.</span>
                  </label>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '1.5rem' }}
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <span>Extracting Keyframes & Analyzing...</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} /> Run Video Review
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results Display */}
        {analysisResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Overview Summary */}
            <div className="card" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Executive Video Review</h3>
                <span className="badge badge-live">Analysis Complete</span>
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {analysisResult.summary}
              </p>
            </div>

            {/* Visual Presentation Scores */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="var(--accent-primary)" /> Visual Presentation & Composition
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Framing & Headroom</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {analysisResult.visualPresentation?.framingScore}/10
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginTop: '6px' }}>
                    {analysisResult.visualPresentation?.framingNotes}
                  </p>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Lighting & Exposure</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {analysisResult.visualPresentation?.lightingScore}/10
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginTop: '6px' }}>
                    {analysisResult.visualPresentation?.lightingNotes}
                  </p>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mount Stability</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {analysisResult.visualPresentation?.stabilityScore}/10
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginTop: '6px' }}>
                    {analysisResult.visualPresentation?.stabilityNotes}
                  </p>
                </div>
              </div>
            </div>

            {/* Retention Hooks & Content Structure */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="card">
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#7E22CE" /> Suggested Retention Hooks
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {analysisResult.suggestedHooks?.map((h: string, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: '#FAF5FF',
                        borderRadius: '6px',
                        border: '1px solid #E9D5FF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        color: '#4C1D95'
                      }}
                    >
                      <span>"{h}"</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopyHook(h, idx)}
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        {copiedIndex === idx ? <Check size={13} color="green" /> : <Copy size={13} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="#D99124" /> Recommendations for Next Take
                </h3>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {analysisResult.recommendations?.map((rec: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

