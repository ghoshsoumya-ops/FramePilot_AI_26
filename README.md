# 🎬 FramePilot AI

### Your AI Director. Every Take. Every Frame.

**An AI-powered real-time video recording director and content co-pilot for digital creators.**

FramePilot AI helps YouTubers, educators, vloggers, podcasters, and short-form video creators improve their recordings through real-time technical monitoring, script tracking, speech analysis, and contextual AI feedback powered by Google Gemini.

Instead of discovering poor lighting, incorrect framing, audio issues, or missed talking points after recording, FramePilot acts as a virtual director during the recording process.

It combines **on-device computer vision, audio signal analysis, browser-based speech recognition, script intelligence, and generative AI** in one unified recording studio.

> **Build better takes. Improve every frame. Create with confidence.**

---

## 🚀 1. Run the Project Locally

FramePilot AI is currently a locally runnable full-stack application. It is not dependent on a Vercel deployment.

You can run the frontend and backend together using **one terminal and one command**.

### Prerequisites

Install the following:

- [Node.js](<https://nodejs.org/>) — Version 18+ or 20+
- npm — Version 9+
- [Git](<https://git-scm.com/>) (optional, for cloning)
- Google Chrome (recommended for camera, microphone, and speech recognition support)

Check your installations:

``` bash
node -v
npm -v
```

### Step 1: Clone the repository

``` bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate into the project:

``` bash
cd FramePilot-AI
```

Alternatively, download the repository as a ZIP, extract it, and open its root folder in your terminal.

### Step 2: Install dependencies

Run this command from the project root:

``` bash
npm install
```

This installs the dependencies required by the frontend and backend.

### Step 3: Configure environment variables

Create or edit the `.env` file in the location expected by the backend.

Use the following configuration:

``` env
# Server Configuration
PORT=3001
CLIENT_ORIGIN=http://localhost:5173

# Gemini API Configuration
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_LIVE_MODEL=gemini-2.5-flash
GEMINI_REPORT_MODEL=gemini-2.5-flash
GEMINI_CONTENT_MODEL=gemini-2.5-flash

# Enable Real Gemini API Mode
MOCK_LLM=false
```

**Important:**

- Obtain your API key from [Google AI Studio](<https://aistudio.google.com/apikey>).
- Replace `YOUR_GEMINI_API_KEY` with your actual key.
- Ensure the configured Gemini model IDs are available to your API account.
- Keep your API key on the backend.
- Never commit your `.env` file to GitHub.
- Make sure `.env` is included in `.gitignore`.

### Step 4: Start the complete application

From the project root, execute:

``` bash
npm run dev
```

This starts both development servers concurrently:

| Service | Local URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Backend health check | http://localhost:3001/api/health |

Open the frontend URL in Google Chrome:

**http://localhost:5173**

The frontend communicates with the backend, which securely handles Gemini API requests.

Keep the terminal running while using the application.

To stop both servers, press:

``` bash
Ctrl + C
```

To start the application again, navigate to the project root and run:

``` bash
npm run dev
```

### Step 5: Verify the installation

The project also provides the following verification commands:

``` bash
# Run automated tests
npm run test

# TypeScript checks
npm run typecheck

# Build the application
npm run build
```

**Note:** The commands above assume the repository's root scripts are configured as described. If a command is unavailable, inspect the root `package.json`.

---

## 💡 2. The Problem We Are Solving

Creating good video content is not just about having a camera and pressing the record button.

Creators frequently struggle with:

- Poor lighting, incorrect framing, and unwanted camera positioning.
- Inconsistent audio levels, clipping, and long silent pauses.
- Forgetting important talking points while recording.
- Losing track of their prepared scripts.
- Speaking too quickly, using excessive filler words, or losing delivery consistency.
- Discovering recording mistakes only after completing an entire take.
- Using multiple disconnected tools for recording, monitoring, and content preparation.

Most conventional recording tools focus on capturing video rather than actively helping creators improve the recording process.

**FramePilot AI addresses this gap by bringing recording assistance, technical monitoring, script awareness, and generative AI coaching into one workspace.**

---

## 🎯 3. Our Solution

FramePilot AI works as a virtual video director that monitors the recording environment, tracks the creator's delivery, and provides useful feedback.

It combines two complementary intelligence layers:

**1. Local Intelligence**

Fast, browser-based analysis for camera framing, lighting, blur, audio levels, silence, and speech tracking.

**2. Generative AI Intelligence**

Google Gemini processes contextual information to generate helpful coaching feedback, content suggestions, scripts, hooks, and post-recording insights.

Rather than sending every video frame to a cloud model, FramePilot uses local analysis first and sends selected contextual information to Gemini when the user has enabled the appropriate privacy mode.

---

## ✨ 4. Core Features \& MVP Capabilities

### 🎥 A. Real-Time AI Recording Director

A virtual director that helps creators improve their recording while they are filming.

- Face presence and position detection.
- Face framing and composition guidance.
- Lighting and exposure classification.
- Basic blur and sharpness estimation.
- Live camera and microphone monitoring.
- Contextual AI-assisted recording feedback.

### 🧠 B. Intelligent Script Companion

Helps creators stay aligned with their prepared content.

- Prepare and use custom recording scripts.
- Track spoken words against the prepared script.
- Identify missed talking points and script drift.
- Provide script-aware recording assistance.
- Support different recording styles through director modes.

### 🎙️ C. Audio \& Speech Intelligence

Monitors important aspects of voice delivery.

- Real-time audio RMS level monitoring.
- Audio clipping detection.
- Silence interval monitoring.
- Speech recognition using the browser's Web Speech API.
- Speaking pace estimation (WPM).
- Filler-word counting.
- Manual transcript fallback where speech recognition is unavailable.

### 🎛️ D. Three Director Modes

FramePilot supports three recording styles:

| Mode | Purpose |
| --- | --- |
| Strict Mode | Helps scripted creators maintain script accuracy and avoid missed talking points. |
| Flexible Mode | Supports conversational creators while maintaining technical recording quality. |
| Coach Mode | Focuses on speaking pace, pauses, and delivery improvement. |

### 🔐 E. Privacy-First Recording

Creators retain control over how their recording information is processed.

| Privacy Mode | Processing |
| --- | --- |
| Local-Only | Camera and audio monitoring remain on-device. No recording frames or transcript are sent to Gemini. |
| Transcript-Only | Spoken transcript and relevant context can be sent to AI without transmitting camera frames. |
| AI-Assisted | Selected, compressed keyframes (maximum 512px) and relevant metrics can be sent to Gemini after explicit user consent. |

Full video recordings are not automatically uploaded to Gemini.

### 📊 F. Post-Recording Analysis

After a recording session, creators can review a structured report.

The report includes:

- Delivery score.
- Technical quality score.
- Script fidelity score.
- Audio quality score.
- Content structure score.
- Chronological director feedback.
- Video playback.

Scores use a deterministic scoring approach where applicable, with AI-generated qualitative feedback providing additional context.

**Export options:**

- Download Report JSON.
- Export Director Notes CSV.
- Download Transcript TXT.

### ✍️ G. AI Hook Intelligence

A content preparation assistant for creators.

- Generate three retention-focused opening hooks.
- Explore curiosity-gap triggers.
- Generate content beat structures.
- Suggest transitions.
- Produce copyable content ideas.

### 📁 H. Video Upload Review

Creators can review an existing local recording.

- Upload local MP4/WebM video files.
- Extract selected keyframes through browser Canvas processing.
- Perform visual and structural review using the available analysis pipeline.
- Generate contextual feedback with Gemini where configured and consented.

---

## ⭐ 5. What Makes FramePilot AI Different?

| Conventional Recording Tools | FramePilot AI |
| --- | --- |
| Primarily capture video | Actively assists during recording |
| Separate tools for lighting and audio checks | Unified technical monitoring |
| Manual script tracking | Speech-aware script tracking |
| Review mistakes after recording | Detect issues during the recording process |
| Generic content generation | Contextual feedback connected to the recording workflow |
| Cloud-dependent analysis approaches | Local-first monitoring with optional Gemini assistance |

### Our Key USPs

**1. Real-Time Director, Not Just an AI Chatbot**

FramePilot connects recording signals, script progress, and creator feedback into one workflow.

**2. Local-First Multimodal Intelligence**

Combines computer vision, audio analysis, and speech recognition without requiring every observation to be processed by a cloud model.

**3. Context-Aware Gemini Assistance**

Uses relevant recording context to generate more useful feedback instead of relying only on generic prompts.

**4. Privacy by Design**

Provides explicit privacy modes and user-controlled sharing of contextual information.

**5. One Unified Creator Studio**

Brings recording, monitoring, script assistance, AI feedback, and post-recording review together.

---

## ⚙️ 6. How It Works — System Workflow

``` mermaid
flowchart TD
    A["Creator opens FramePilot AI"] --> B["Prepare Script & Select Director Mode"]
    B --> C["Configure Camera, Microphone & Privacy"]
    C --> D["Start Recording"]
    D --> E["Local Intelligence Engine"]
    E --> F["Computer Vision"]
    E --> G["Audio Analysis"]
    E --> H["Speech Recognition & Script Tracking"]
    F --> I["Recording Metrics"]
    G --> I
    H --> I
    I --> J{"AI Assistance Enabled?"}
    J -->|Yes, with consent| K["Backend API"]
    K --> L["Google Gemini"]
    L --> M["Contextual Director Feedback"]
    J -->|No| N["Local Feedback"]
    M --> O["Live Recording Workspace"]
    N --> O
    O --> P["Stop Recording"]
    P --> Q["Post-Recording Analysis"]
    Q --> R["Scores, Notes, Playback & Exports"]
```

### Processing Pipeline

1. **Capture:** The browser accesses the selected camera and microphone after user permission.
2. **Local Analysis:** MediaPipe, Canvas, Web Audio, and speech recognition provide recording signals.
3. **Contextual Evaluation:** Script progress, audio metrics, visual observations, and recent feedback are evaluated.
4. **AI Assistance:** When enabled and consented, selected context is sent to the backend and processed using Google Gemini.
5. **Feedback:** The creator receives relevant recording guidance.
6. **Review:** After recording, the application generates a structured report and provides export options.

---

## 🧰 7. Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Generative AI | Google Gemini API |
| Computer Vision | MediaPipe Tasks Vision |
| Image Processing | HTML Canvas API |
| Audio Processing | Web Audio API |
| Speech Recognition | Web Speech API |
| Script Intelligence | Fuzzy text matching |
| API Communication | REST APIs |
| Testing | Vitest, Supertest |
| Development | npm, Git, Vite |

### Why This Stack?

- **React + Vite:** Responsive and fast frontend development.
- **Node.js + Express:** Lightweight backend for API orchestration.
- **Google Gemini:** Generative AI for contextual coaching and content intelligence.
- **MediaPipe:** Browser-side visual analysis.
- **Web Audio API:** Real-time audio signal monitoring.
- **Web Speech API:** Browser-based speech recognition.
- **TypeScript:** Better code reliability and maintainability.

---

## 🏗️ 8. Architecture Overview

FramePilot AI follows a frontend-backend architecture.

``` text
FramePilot AI
│
├── Frontend (React + Vite)
│   ├── Recording Studio
│   ├── Script Companion
│   ├── Camera & Audio Monitoring
│   ├── Director Feedback
│   ├── Content Intelligence
│   └── Analysis Reports
│
├── Backend (Node.js + Express)
│   ├── Gemini API Integration
│   ├── AI Coaching Endpoint
│   ├── Take Report Endpoint
│   ├── Script Generation Endpoint
│   ├── Hook Generation Endpoint
│   └── Upload Analysis Endpoint
│
└── Browser Intelligence
    ├── MediaPipe Vision
    ├── Canvas Processing
    ├── Web Audio Analysis
    ├── Speech Recognition
    └── Local Session Data
```

### Backend API Endpoints

| Endpoint | Responsibility |
| --- | --- |
| `GET /api/health` | Backend health check |
| `POST /api/coach` | Contextual recording feedback |
| `POST /api/take-report` | Post-recording report generation |
| `POST /api/generate-script` | AI script generation |
| `POST /api/generate-hooks` | Hook and content idea generation |
| `POST /api/analyze-upload` | Uploaded video analysis |

---

## 🚧 9. Current MVP Scope \& Hackathon Development

FramePilot AI is being developed for **GeNarrative Clash 2026**, under the Autonomous Creator Agents direction.

The hackathon follows a 50/50 building approach: teams can pre-build up to 50% before the event, with the remaining 50% developed during the six-hour live sprint.

### Current Pre-Built MVP Foundation

The current prototype establishes the core recording and creator-assistance workflow:

- Full-stack React and Express application structure.
- Gemini API integration architecture.
- Real-time camera and microphone access.
- Local face, framing, lighting, and blur analysis.
- Audio level, clipping, and silence monitoring.
- Speech recognition and script tracking.
- Three director modes.
- Privacy controls for AI-assisted processing.
- Contextual AI coaching pipeline.
- Post-recording report and export workflow.
- AI hook generation and script assistance.
- Local video upload and keyframe review workflow.

### Planned Live-Sprint Development

The remaining development will focus on strengthening and extending the prototype through:

- Improving contextual Gemini prompt orchestration.
- Enhancing the AI director's decision-making and feedback relevance.
- Refining multimodal context handling.
- Improving creator-specific recommendations.
- Strengthening the complete recording-to-review workflow.
- Testing, integration, and reliability improvements.

The exact scope of live-sprint additions will depend on the event requirements and development progress.

**Our objective:** Move from a functional recording assistant towards a more intelligent, context-aware AI director for digital creators.

---

## 🔮 10. Future Scope

Beyond the current MVP, FramePilot AI can evolve into a more comprehensive creator platform.

Potential extensions include:

- Advanced agentic workflows for end-to-end content preparation.
- Personalized creator profiles and adaptive coaching.
- Multi-platform content formatting.
- Automated editing recommendations and highlight detection.
- Advanced audio and video quality evaluation.
- Creator performance analytics.
- Social media publishing and scheduling integrations.
- Collaborative creator workspaces.

These are future directions, not claims about currently implemented functionality.

---

## 🔒 11. Security \& Privacy Considerations

- Gemini API keys are stored and used on the backend.
- API secrets must never be committed to the repository.
- Camera and microphone access require browser permission.
- AI-assisted frame sharing requires explicit user consent.
- Local-only mode avoids external AI requests for recording analysis.
- Selected keyframes are compressed before optional transmission.
- Full recordings are not automatically uploaded to Gemini.

---

## 🖥️ 12. Browser Compatibility

For the best experience, use an up-to-date version of Google Chrome.

Some capabilities depend on browser support:

- Camera and microphone: `getUserMedia` and MediaRecorder.
- Speech recognition: Web Speech API support.
- Computer vision: MediaPipe Tasks Vision and browser capabilities.
- Local processing: Canvas and Web Audio APIs.

Speech recognition may require a manual transcript fallback in unsupported browsers.

---

## 👥 13. Team

**Team No Comments**

Built with the goal of making video creation smarter, more accessible, and more creator-friendly.

---

## 🏆 14. Hackathon

**GeNarrative Clash 2026**

Organised by the GeeksforGeeks Student Chapter, Techno India University.

**Track Direction:** Autonomous Creator Agents

**Project:** FramePilot AI — Your AI Director. Every Take. Every Frame.

Event: November 21, 2026  
Venue: Techno India University, Sector V, Kolkata.

Official event information:  
https://genarrative-clash.devfolio.co/overview

---

## 🎥 15. Project Demo

**Live Demo:** Not deployed yet — run locally using the Quick Start instructions above.

**Demo Video:** \[Add your recorded demo video URL here\]

**GitHub Repository:** \[Add your repository URL here\]

---

## 📜 16. License

This project is developed as a hackathon MVP. Add an appropriate open-source license before distributing or reusing the source code.

---

<p align="center">

**FramePilot AI**

*Your AI Director. Every Take. Every Frame.*

**Create Smarter. Record Better. Improve Every Take.**

</p>

