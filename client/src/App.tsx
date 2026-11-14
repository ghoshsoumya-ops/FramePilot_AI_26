import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { Landing } from './pages/Landing.js';
import { Dashboard } from './pages/Dashboard.js';
import { ScriptSetup } from './pages/ScriptSetup.js';
import { RecordingSetup } from './pages/RecordingSetup.js';
import { LiveStudio } from './pages/LiveStudio.js';
import { AnalysisReport } from './pages/AnalysisReport.js';
import { UploadAnalysis } from './pages/UploadAnalysis.js';
import { ContentTools } from './pages/ContentTools.js';
import { Settings } from './pages/Settings.js';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isStudio = location.pathname.startsWith('/studio');

  return (
    <>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/script" element={<ScriptSetup />} />
          <Route path="/setup" element={<RecordingSetup />} />
          <Route path="/studio" element={<LiveStudio />} />
          <Route path="/report" element={<AnalysisReport />} />
          <Route path="/upload-analysis" element={<UploadAnalysis />} />
          <Route path="/content-tools" element={<ContentTools />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      {!isStudio && <Footer />}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;

