import './config/env.js';
import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FramePilot Backend] Server running on port ${PORT}`);
  console.log(`[FramePilot Backend] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[FramePilot Backend] Mode: ${process.env.MOCK_LLM === 'true' || !process.env.GEMINI_API_KEY ? 'DEMO MOCK MODE' : 'LIVE GEMINI ENGINE'}`);
  console.log(`[FramePilot Backend] Models: Live=${process.env.GEMINI_LIVE_MODEL || 'gemini-3.5-flash-lite'}, Report=${process.env.GEMINI_REPORT_MODEL || 'gemini-3.5-flash'}, Content=${process.env.GEMINI_CONTENT_MODEL || 'gemini-3.5-flash'}`);
});
