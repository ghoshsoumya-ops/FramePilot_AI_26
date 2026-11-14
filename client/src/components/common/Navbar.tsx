import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Video, Sparkles, FileText, Settings, UploadCloud, Film } from 'lucide-react';
import { ApiService } from '../../services/api.js';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMock, setIsMock] = useState<boolean>(true);

  useEffect(() => {
    ApiService.getHealth()
      .then(res => setIsMock(res.mockMode))
      .catch(() => setIsMock(true));
  }, []);

  const isStudio = location.pathname.startsWith('/studio');

  return (
    <header className="app-header" style={isStudio ? { background: '#101318', borderColor: '#2D3748' } : {}}>
      <div className={isStudio ? 'container-wide' : 'container'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" className="logo-badge" style={isStudio ? { color: '#F8FAFC' } : {}}>
          <div className="logo-icon" style={isStudio ? { background: '#2563EB' } : {}}>
            <Film size={16} />
          </div>
          <span>FramePilot</span>
          <span className="badge badge-demo" style={{ fontSize: '0.65rem', marginLeft: '4px' }}>
            {isMock ? 'Demo AI' : 'Live GenAI'}
          </span>
        </Link>

        <nav className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            style={isStudio ? { color: '#94A3B8' } : {}}
          >
            Dashboard
          </Link>
          <Link
            to="/script"
            className={`nav-link ${location.pathname === '/script' ? 'active' : ''}`}
            style={isStudio ? { color: '#94A3B8' } : {}}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={15} /> Scripts
            </span>
          </Link>
          <Link
            to="/content-tools"
            className={`nav-link ${location.pathname === '/content-tools' ? 'active' : ''}`}
            style={isStudio ? { color: '#94A3B8' } : {}}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={15} /> Hooks & AI
            </span>
          </Link>
          <Link
            to="/upload-analysis"
            className={`nav-link ${location.pathname === '/upload-analysis' ? 'active' : ''}`}
            style={isStudio ? { color: '#94A3B8' } : {}}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <UploadCloud size={15} /> Upload Review
            </span>
          </Link>
          <Link
            to="/settings"
            className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
            style={isStudio ? { color: '#94A3B8' } : {}}
          >
            <Settings size={15} />
          </Link>
        </nav>

        <div>
          <Link to="/setup" className="btn btn-primary btn-sm">
            <Video size={15} /> Launch Studio
          </Link>
        </div>
      </div>
    </header>
  );
};

