# Meeting Summarizer — Intelligent ASR & Action Item Extraction Platform

A production-oriented, full-stack Meeting Intelligence Platform designed to ingest audio recordings, transcribe dialogue with speaker identification, extract strategic decisions, synthesize executive summaries, and track zero-hallucination action items with assignees and deadlines.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT 19 FRONTEND                               │
│  - Dashboard Metrics & Analytics    - In-Browser Audio Recorder             │
│  - Real-Time Pipeline Progress Bar  - Speaker-Segmented Transcript Viewer   │
│  - Interactive Action Item Kanban   - Key Decisions & Synthesis Viewer      │
│  - Automated In-App Test Suite      - Export to Markdown & JSON             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST API (Port 3000)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXPRESS.JS BACKEND (MVC)                           │
│                                                                             │
│  [Routes Layer]        --> /api/meetings (CRUD, Audio Stream, Action PATCH) │
│  [Controller Layer]    --> MeetingController (Request handling & validation)│
│  [Validation Layer]    --> MeetingValidator (File types, status, titles)    │
│  [Middleware]          --> Multer (Streaming upload), ErrorHandler          │
│  [Service Layer]       --> MeetingService (Asynchronous Orchestrator)       │
└───────────────┬───────────────────────────────────────────────┬─────────────┘
                │                                               │
                ▼                                               ▼
┌──────────────────────────────┐                ┌──────────────────────────────┐
│       AI / ASR SERVICES      │                │       PERSISTENCE LAYER      │
│                              │                │                              │
│ • TranscriptionService:      │                │ • MeetingDatabase (db):      │
│   Multimodal Gemini 3.7      │                │   JSON & in-memory cache     │
│   Flash audio-to-text with   │                │   repository                 │
│   speaker segmentation       │                │                              │
│                              │                │ • StorageService:            │
│ • SummarizationService:      │                │   Local filesystem audio     │
│   Structured JSON Schema LLM │                │   file storage & streaming   │
│   with anti-hallucination    │                │                              │
│   prompt engineering         │                │ • data/meetings.json:        │
│                              │                │   Durable meeting storage    │
└──────────────────────────────┘                └──────────────────────────────┘
```

---

## 🚀 Key Features

1. **Multimodal ASR Speech-to-Text Pipeline**:
   - Transcribes MP3, WAV, M4A, WEBM, and OGG audio streams.
   - Extracts verbatim transcripts with accurate speaker turns (`Speaker 1`, `Speaker 2`, or participant names).

2. **Zero-Hallucination Action Item Extraction**:
   - Enforces strict ground-truth prompting: if an owner or deadline is not explicitly articulated in the meeting, the system records `Owner: Not specified` and `Deadline: Not specified` rather than hallucinating details.
   - Interactive task status switcher (`pending`, `in_progress`, `completed`) and inline owner reassignments.

3. **Strategic Key Decisions & Consensus**:
   - Isolates binding decisions from general discussions, tagging categories (e.g., *Database Architecture*, *Infrastructure*, *Reliability*).

4. **In-Browser Audio Recording & Real Audio Waveform**:
   - Record meetings directly through your microphone using Web MediaRecorder API.
   - Audio is buffered, uploaded, and streamed via custom HTML5 audio controls.

5. **Pre-Loaded Enterprise Sample Scenarios**:
   - Ready-to-analyze scenarios including Cloud Architecture Migration, Product Sprint Planning, and Incident Postmortems.

6. **Comprehensive Automated Test Suite**:
   - In-app interactive test runner verifying REST endpoints, negative validation cases, sample ingestion, and action item mutations.

---

## 📡 REST API Reference

### Health
- `GET /api/health` — Checks service health and environment readiness.

### Meetings
- `GET /api/meetings` — Returns all meeting sessions with summary metrics.
- `GET /api/meetings/:id` — Returns single meeting details and processing status.
- `POST /api/meetings/upload` — Multipart form upload (`audio` field, optional `title`).
- `POST /api/meetings/sample` — Ingests a pre-formatted transcript/sample meeting.
- `GET /api/meetings/:id/audio` — Streams original audio file with byte-range support.
- `PATCH /api/meetings/:id/action-items/:actionItemId` — Mutates action item status and assignee.
- `POST /api/meetings/:id/reprocess` — Re-runs ASR and LLM summarization pipeline.
- `DELETE /api/meetings/:id` — Deletes meeting record and associated audio file.

---

## 🧪 Testing & Verification

1. **In-App Integration Runner**: Click **"Run Test Suite"** in the top navigation bar to execute live end-to-end API tests.
2. **Backend Unit Tests**: Run `npx tsx server/tests/meeting.test.ts` to execute automated assertions on validators and the database repository.

## Getting Started

### Requirements

- Node.js 20 or newer
- A Gemini API key for transcription and summarization
- Cloudinary credentials for persistent video storage in production

### Install

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` and set the required values:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Cloudinary variables are optional for local testing. Without them, uploads use the local `uploads/` directory.

### Run Locally

```powershell
npm run dev
```

Open http://localhost:3000 in a browser. The same command starts the Express API and the Vite frontend.

### Validate and Build

```powershell
npm run lint
npm run build
npx tsx server/tests/meeting.test.ts
```

To run the production build locally:

```powershell
$env:NODE_ENV="production"
$env:PORT="3000"
npm start
```

### Storage

- Meeting metadata is stored in `data/meetings.json`.
- Local temporary uploads are stored in `uploads/`.
- When Cloudinary is configured, new videos are stored in the `meeting-summarizer` Cloudinary folder and played from their secure URL.
- Do not commit `.env`, API keys, or Cloudinary secrets.

### Deployment

Configure the hosting provider with:

```text
Build command: npm install && npm run build
Start command: npm start
```

Set `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` as hosting environment variables. The application reads the hosting provider's `PORT` value automatically.
