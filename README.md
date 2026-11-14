# FRAMEPILOT AI
> **Your AI Director. Every Take. Every Frame.**

FramePilot AI is a full-stack, real-time AI video recording director and content coach designed for creators (YouTubers, educators, vloggers, podcasters, and short-form creators).

It integrates local computer vision, Web Audio analysis, speech recognition, fuzzy script tracking, and contextual Google Gemini AI assistance into a unified studio recording workflow.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **npm** (v9+)

### 2. Environment Setup
The repository comes pre-configured with `.env.example` and a default `.env` running in **Offline Mock Mode (`MOCK_LLM=true`)**, requiring **no API keys** to run and evaluate:

```bash
# Server Configuration
PORT=3001
CLIENT_ORIGIN=http://localhost:5173

# Gemini API Configuration (Optional: enter your key to enable live Gemini inference)
GEMINI_API_KEY=
GEMINI_LIVE_MODEL=gemini-2.5-flash
GEMINI_REPORT_MODEL=gemini-2.5-flash
GEMINI_CONTENT_MODEL=gemini-2.5-flash

# Mock Mode (Set to true to run fully offline without a Gemini API Key)
MOCK_LLM=true
```

### 3. Install & Start Development Servers
From the root directory:

```bash
# Install dependencies
npm install

# Start both Backend (Port 3001) and Frontend (Port 5173) concurrently
npm run dev
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)
- **Health Endpoint:** [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 🧪 Verification & Testing

```bash
# Run Vitest test suite (Unit tests + Supertest backend API integration)
npm run test

# Typecheck both Client and Server
npm run typecheck

# Run Production Build (Client + Server + PWA assets)
npm run build
```

---

## 🏗 Architecture & Features

### 1. Three Director Modes
- **Strict Mode:** For scripted educational or high-fidelity videos. Detects skipped talking points and script drift.
- **Flexible Mode:** For vloggers and conversational creators. Allows ad-libbing while ensuring visual quality and delivery.
- **Coach Mode:** For presentation coaching. Monitors speaking pace (WPM), long pauses, and filler words.

### 2. Three Privacy Modes
- **Local-Only Mode:** 100% on-device vision and audio monitoring. Zero external network requests.
- **Transcript-Only Mode:** Sends spoken words to AI; never transmits camera frames.
- **AI-Assisted Mode:** Sends downscaled keyframes (max 512px) and metrics to Gemini **only after explicit user consent**.

### 3. Local Computer Vision & Audio Engine
- **MediaPipe Tasks Vision:** Face presence and bounding box tracking.
- **Framing Guide:** Evaluates center-third composition and eye-level headroom.
- **Luminance Analysis:** Average frame brightness classification (`LOW_LIGHT`, `ACCEPTABLE`, `OVEREXPOSURE`).
- **Sharpness / Blur Detection:** Fast Laplacian variance approximation.
- **Web Audio API:** Real-time RMS decibel monitoring, clipping detection, and silence intervals.
- **Speech Recognition:** Web Speech API with real-time WPM pace calculation and filler word counter, with a manual transcript fallback.

### 4. Post-Recording Analysis Report
- Deterministic 0-100 score across Delivery, Technical, Script Fidelity, Audio Quality, and Content Structure.
- Chronological director notes log.
- Video playback player.
- Instant exports: **Download Report JSON**, **Export Notes CSV**, and **Download Transcript TXT**.

### 5. Content & Upload Tools
- **AI Hook Intelligence:** Generates 3 engineered retention hooks, curiosity gap triggers, beat structures, and copyable transitions.
- **Video Upload Review:** In-browser Canvas keyframe extraction from local video files (MP4/WebM) with visual and structural analysis.

