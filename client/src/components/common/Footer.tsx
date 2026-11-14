import React from 'react';
import { Film, ShieldCheck, Cpu, Mic } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', padding: '2.5rem 0', marginTop: 'auto' }}>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
            <Film size={18} />
            <span>FRAMEPILOT AI</span>
          </div>
          <p style={{ marginTop: '4px', fontSize: '0.85rem' }}>
            Your AI Director. Every Take. Every Frame. Built for creators.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={14} /> Local Computer Vision
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mic size={14} /> Web Audio Monitoring
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> Privacy-First Architecture
          </span>
        </div>
      </div>
    </footer>
  );
};

