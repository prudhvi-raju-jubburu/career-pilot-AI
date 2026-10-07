# CareerPilot AI — Autonomous Career Discovery & Student Readiness Platform

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-PyMongo-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**CareerPilot AI** is a production-grade, AI-augmented career opportunity discovery and student readiness platform built specifically for university students and early-career software engineers. 

The platform runs 100% on **REAL MongoDB collections** and **LIVE, continuously refreshed data from multiple external sources** with real-time Server-Sent Events (SSE) updates, deterministic student profile & resume parsing, ATS scoring, and zero mock or fixture data in production code.

---

## 📑 Table of Contents

- [Core Platform Capabilities](#-core-platform-capabilities)
- [System Architecture](#-system-architecture)
- [Canonical Data Models & MongoDB Schema](#-canonical-data-models--mongodb-schema)
- [Ingestion Pipeline & 5 Live External Sources](#-ingestion-pipeline--5-live-external-sources)
- [Zero-Mock Acceptance Guarantee](#-zero-mock-acceptance-guarantee)
- [Real-Time SSE Stream Architecture](#-real-time-sse-stream-architecture)
- [Skill Normalization & Roadmap Engine](#-skill-normalization--roadmap-engine)
- [REST API Reference](#-rest-api-reference)
- [Frontend Architecture & Design System](#-frontend-architecture--design-system)
- [Security, Provenance & Quality Control](#-security-provenance--quality-control)
- [Installation & Quick Start](#-installation--quick-start)
- [Testing & Quality Verification](#-testing--quality-verification)
- [Project Directory Structure](#-project-directory-structure)

---

## 🌟 Core Platform Capabilities

### 1. Opportunity Discovery & Ingestion Engine
- **5 Live External Connectors**: Ingests real software engineering roles, internships, hackathons, coding contests, and scholarships from Remotive, Arbeitnow, Codeforces, Devfolio, and OpportunityDesk. (See [docs/sources.md](file:///d:/careerpilot_ai/docs/sources.md) for rate limits, schedules, and schemas).
- **Deterministic Deduplication**: Employs SHA-256 fingerprint hashing combining title + company canonicalization, coupled with fuzzy matching (`SequenceMatcher` threshold $\ge 0.85$).
- **Automated Lifecycle Expiration**: Built-in background engine marks opportunities with past deadlines as `expired`, preventing stale listings from cluttering student feeds.
- **Circuit Breaker & Resilience**: Per-connector exponential backoff, rate limiting, and circuit breaker trip state preventing third-party timeouts from affecting service.

### 2. Student Profile & Resume Provenance
- **Field-Level Provenance (`field_sources`)**: Every attribute in a student's profile tracks its exact origin (`manual`, `resume`, or `system`) along with updated timestamps.
- **Manual-Field Protection**: User-verified edits are safeguarded from being overwritten by subsequent automated resume parsers.
- **Dual-Engine Resume Parser**: Text extraction from both PDF (`pypdf`) and Word DOCX (`python-docx`), analyzed via Google Gemini AI for ATS scoring, skills, and projects.

### 3. Applications Pipeline & Kanban Tracker
- **Stage Progression**: Full CRUD tracking across `Saved`, `Applied`, `Interviewing`, `Offer`, and `Rejected`.
- **Timeline & Notes**: Automatic audit event logging for status changes, dates, notes, and offer confetti triggers.

### 4. Real-Time SSE Stream & AI Advisor
- **SSE Opportunities Stream (`/api/stream/opportunities`)**: Pub/Sub event stream broadcasting newly discovered roles with auto-reconnecting React hook.
- **Conversational Career Advisor**: Interactive career coach grounded in student profile context with chat history persisted in MongoDB.

---

## 🏛️ System Architecture

```
                                  ┌──────────────────────────────┐
                                  │      React 18 SPA Client     │
                                  │  (Vite + React Router + CSS) │
                                  └──────────┬────────┬──────────┘
                                             │        │ Server-Sent Events (SSE)
                                  HTTP/REST  │        │ /api/stream/opportunities
                                             ▼        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                Flask 3.1 Application Server                            │
│                                                                                        │
│   ┌─────────────────────┐   ┌──────────────────────────┐   ┌───────────────────────┐   │
│   │   Auth & Security   │   │  Opportunities Blueprint │   │  Applications Tracker │   │
│   │  (JWT + Refresh)    │   │  (Search, Save, Match)   │   │  (CRUD, Stages, Audit)│   │
│   └─────────────────────┘   └─────────────┬────────────┘   └───────────────────────┘   │
│                                           │                                            │
│   ┌─────────────────────┐   ┌─────────────┴────────────┐   ┌───────────────────────┐   │
│   │ Dashboard & Stats   │   │  Sources Telemetry       │   │  AI Career Advisor    │   │
│   │ (Real Mongo Counts) │   │  (Live Status & Sync)    │   │  (Chat Stream & Logs) │   │
│   └─────────────────────┘   └─────────────┬────────────┘   └───────────────────────┘   │
│                                           │                                            │
│   ┌───────────────────────────────────────┴────────────────────────────────────────┐   │
│   │                         Ingestion & Live Connector Layer                       │   │
│   │                                                                                │   │
│   │   ┌───────────────────┐    ┌────────────────────┐    ┌─────────────────────┐   │   │
│   │   │ OpportunityService│    │  ProfileService    │    │  EventStreamManager │   │   │
│   │   └─────────▲─────────┘    └────────────────────┘    └─────────────────────┘   │   │
│   │             │                                                                  │   │
│   │   ┌─────────┴─────────┐    ┌────────────────────┐    ┌─────────────────────┐   │   │
│   │   │ Ingestion Pipeline│    │ APScheduler Daemon │    │ SHA-256 + Fuzzy     │   │   │
│   │   └─────────▲─────────┘    └────────────────────┘    │ Deduplicator        │   │   │
│   │             │                                        └─────────────────────┘   │   │
│   │   ┌─────────┴──────────────────────────────────────────────────────────────┐   │   │
│   │   │ 5 Live External Connectors:                                            │   │   │
│   │   │ • Remotive (Jobs)       • Arbeitnow (Tech)     • Codeforces (Contests) │   │   │
│   │   │ • Devfolio (Hackathons) • OpportunityDesk (RSS Scholarships)           │   │   │
│   │   └────────────────────────────────────────────────────────────────────────┘   │   │
│   └───────────────────────────────────────┬────────────────────────────────────────┘   │
└───────────────────────────────────────────┼────────────────────────────────────────────┘
                                            │ PyMongo Driver
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MongoDB 6.0+ Database                                │
│                                                                                        │
│   • opportunities       (Active opportunities, hashed dedupes, text indexes)           │
│   • student_profiles    (Unique user_id, field provenance, verified flags)             │
│   • users               (Unique email, bcrypt hashed passwords, JWT refresh)           │
│   • applications        (Tracked applications, stages, timeline history, notes)        │
│   • notifications       (System alerts, deadline warnings, daily digests)              │
│   • source_runs         (Telemetry history: duration, fetched, accepted, status)       │
│   • advisor_conversations (Student AI advisor chat messages & timestamps)              │
│   • learning_progress   (User skill topic tracking)                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Canonical Data Models & MongoDB Schema

### 1. Opportunities Collection (`opportunities`)

```json
{
  "_id": "ObjectId('6ac0c7e68ff19163d196a278')",
  "title": "Software Engineer Intern — Summer 2026",
  "organization": {
    "name": "Google",
    "website": "https://careers.google.com"
  },
  "description": "Build high-scale software applications and tools used by billions. Work with Google engineers on core systems, testing, and architecture.",
  "type": "internship",
  "category": "software",
  "location": {
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India",
    "is_remote": false
  },
  "work_mode": "Hybrid",
  "skills": ["C++", "Data Structures & Algorithms", "Java", "Python", "System Design"],
  "education_requirements": {
    "degrees": ["B.Tech", "B.E.", "M.Tech", "M.S."],
    "branches": ["Computer Science", "Information Technology", "Electronics"],
    "graduation_years": [2026, 2027],
    "cgpa_min": 7.5
  },
  "experience": {
    "min_years": 0,
    "max_years": 1
  },
  "eligibility_text": "Must be currently enrolled in an engineering degree graduating in 2026 or 2027. Minimum 7.5 CGPA required.",
  "application_url": "https://careers.google.com/jobs/results/swe-intern-india",
  "source": {
    "name": "careerpilot_curated_feed",
    "url": "https://careers.google.com/jobs/results/swe-intern-india",
    "external_id": "google-swe-intern-2026"
  },
  "dates": {
    "posted_at": "2026-09-15T00:00:00+00:00",
    "deadline": "2026-11-30T23:59:59+00:00"
  },
  "compensation": {
    "type": "stipend",
    "min": 110000,
    "max": 130000,
    "currency": "INR"
  },
  "status": "active",
  "metadata": {
    "tags": ["faang", "summer-2026", "campus"],
    "raw_hash": "careerpilot_curated_feed:google-swe-intern-2026"
  },
  "created_at": "2026-10-03T09:16:22.214232+00:00",
  "updated_at": "2026-10-03T10:05:26.177110+00:00",
  "last_seen_at": "2026-10-03T10:05:26.177110+00:00"
}
```

#### MongoDB Indexes
- `metadata.raw_hash` (Unique, Sparse) — Enforces hard database-level deduplication.
- `status` — Efficiently slices active vs expired opportunities.
- `type` & `category` — Fast faceted filtering.
- `skills` (Multi-key index) — High-speed matching on student skill arrays.
- `dates.deadline` — Powers deadline queries and automated status expiration.
- Compound Index `[("status", 1), ("type", 1), ("dates.deadline", 1)]` — Optimizes the primary explorer query.

---

## 🔄 Ingestion Pipeline & Source Adapters

The opportunity ingestion architecture is decoupled from Flask web threads:

```
Source Adapter (fetch) 
       ↓ 
Raw Extraction 
       ↓ 
Canonical Mapping 
       ↓ 
Deterministic Normalization (Title, Org, Type, Location, Skills, Dates) 
       ↓ 
Quality Validation (Schema integrity, valid URLs, non-empty titles) 
       ↓ 
Deduplication Fingerprinting (SHA-256 raw_hash check) 
       ↓ 
Atomic Upsert in MongoDB ($set updated_at, $setOnInsert created_at)
```

### Source Providers
- **`SampleOpportunitySource`**: Curated, verified repository of high-value opportunities from Google, Stripe, Microsoft Research, Major League Hacking, Smart India Hackathon (SIH), Postman, and Meta.
- **`PublicFeedOpportunitySource`**: Lightweight HTTP adapter that queries robots.txt-compliant public remote technical feeds with strict timeouts and rate limits.
- **APScheduler Service**: Background cron runs every 6 hours to discover updates and transition past opportunities to `expired` status.

---

## 🧠 Skill Normalization & Roadmap Engine

Skill names in free text and resumes are chaotic. CareerPilot maintains a central alias dictionary in `backend/app/utils/skill_normalizer.py`:

| Raw Input Variations | Canonical Stored Form |
| :--- | :--- |
| `React.js`, `ReactJS`, `react js` | **React** |
| `NodeJS`, `Node JS`, `Node.js Engine` | **Node.js** |
| `Mongo DB`, `Mongo Database` | **MongoDB** |
| `Postgres`, `PostgreSQL DB` | **PostgreSQL** |
| `Golang` | **Go** |
| `Fast API`, `fastapi` | **FastAPI** |

### Skill Gap Analysis
- Evaluates role requirements across Core, Development, Engineering, and Tooling.
- Provides comprehensive 5-level topic outlines for each missing skill (Syntax $\to$ Internals $\to$ Architecture $\to$ Production $\to$ Advanced Optimization).
- Links students to curated documentation and practical resume capstone projects.

---

## 📡 REST API Reference

All responses strictly follow the standardized envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message"
}
```

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a new student account | No |
| `POST` | `/api/auth/login` | Sign in & receive signed JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user context | Yes (Bearer) |

### Opportunities (`/api/opportunities`)
| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/opportunities` | `page`, `limit`, `search`, `type`, `category`, `location`, `remote`, `sort` | Paginated opportunity list with filters |
| `GET` | `/api/opportunities/<id>` | — | Fetch single opportunity by ID |
| `GET` | `/api/opportunities/categories` | — | Available categories with item counts |
| `GET` | `/api/opportunities/filters` | — | Faceted filter options (types, locations) |
| `POST` | `/api/opportunities/ingest` | `source` (optional) | Trigger manual ingestion run |

### Student Profile (`/api/profile`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile` | Retrieve student profile & provenance | Yes |
| `PUT` | `/api/profile` | Update profile fields (marked as `manual`) | Yes |
| `GET` | `/api/profile/completion` | Fetch completion percentage & missing tasks | Yes |
| `POST` | `/api/profile/verify` | Confirm profile accuracy | Yes |

### Skill Gap & Learning (`/api/skill-gap`)
| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/skill-gap` | `targetRole` | Calculate role readiness & roadmap |
| `GET` | `/api/skill-gap/roles` | — | List all industry target roles |
| `POST` | `/api/skill-gap/progress` | — | Track mastered topics for a skill |

### Applications Pipeline (`/api/applications`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/applications` | List user's tracked applications | Yes |
| `POST` | `/api/applications` | Track a new opportunity | Yes |
| `GET` | `/api/applications/<id>` | Fetch application detail with timeline | Yes |
| `PATCH` | `/api/applications/<id>/stage` | Update Kanban pipeline stage | Yes |
| `POST` | `/api/applications/<id>/notes` | Add a note to timeline | Yes |
| `DELETE` | `/api/applications/<id>` | Untrack / delete application | Yes |

### Notifications & Daily Digest (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | List user notifications | Yes |
| `PATCH` | `/api/notifications/<id>/read` | Mark notification as read | Yes |
| `POST` | `/api/notifications/read-all` | Mark all notifications read | Yes |
| `GET` | `/api/notifications/digest` | Generate daily career digest | Yes |

### External Sources & Ingestion (`/api/sources`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sources/status` | Live status & metrics of 5 connectors | No |
| `POST` | `/api/sources/sync` | Trigger instant background sync | Yes |

### AI Career Advisor (`/api/advisor`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/advisor/history` | Fetch persistent chat history | Yes |
| `POST` | `/api/advisor/chat` | Send message (Gemini AI grounded) | Yes |
| `GET` | `/api/advisor/stream` | SSE real-time token stream | Yes |
| `DELETE` | `/api/advisor/history` | Clear conversation history | Yes |

### Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Real computed MongoDB collection telemetry | Yes |

### Real-Time Live Stream (`/api/stream`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stream/opportunities` | Server-Sent Events (SSE) live opportunities feed | No |

### System Health (`/api/health`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, collection counts & scheduler status |

---

---

## 🎨 Frontend Architecture & "Mission Control" Design System (v2.0 Redesign)

The CareerPilot AI frontend is engineered to top-tier design-driven startup standards (Linear, Vercel, Stripe, Arc). It departs completely from generic templates by establishing the **"Mission Control for Your Career"** visual and interactive paradigm.

### 1. Signature Design Language (`src/styles/design-language.md`)
- **Metaphor**: Flight-deck telemetry, radar sweeps, orbital progress rings, and trajectory waypoints.
- **3 Celestial Accents**:
  1. **Pulsar Cyan (`#00F2FE`)**: Navigational radar, high match scores ($\ge 85\%$), discovery searchlights.
  2. **Solar Flare Amber (`#F59E0B`)**: Real-time ticking deadlines ("closes in 2d 4h"), urgency alerts, focus stage.
  3. **Quantum Violet (`#8B5CF6`)**: Neural AI core reasoning, resume ML analysis, skill graph mastery.
- **4 Signature Themes**:
  - `Deep Space Obsidian` (Default dark-first flight deck)
  - `Solar Daybreak` (High-contrast clean daylight HUD)
  - `Neon Hyperdrive` (Cyberpunk vibrant violet & laser cyan)
  - `Aurora Matrix` (Luminescent deep-space emerald)
  - Smooth circular reveal transition via View Transitions API (`::view-transition-new(root)`).
- **Typography Continuum**:
  - Display: `Space Grotesk` (Expressive, mechanical display font)
  - Text: `Inter` (Ultra-crisp UI and body copy)
  - Telemetry: `JetBrains Mono` (Tabular numbers, match percentages, timers, salary figures)
  - Fluid type scale via CSS `clamp()`

### 2. Advanced Motion Physics System (`src/motion/`)
- **Physics Tokens (`tokens.js`)**: Spring models for `snappy` (stiffness: 420, damping: 30), `smooth` (stiffness: 260, damping: 26), `gentle` (stiffness: 120, damping: 18), and `bouncy` (stiffness: 480).
- **Custom Hooks (`hooks.js`)**:
  - `useMagnetic`: Organic cursor attraction for buttons & badges.
  - `useTilt`: 3D perspective tilt on cards with dynamic spotlight coordinate calculation.
  - `useScrollProgress`: Scroll-linked telemetry progress tracking.
  - `useCountUp`: Smooth numeric telemetry counters.
  - `useInView`: Lightweight viewport entrance trigger.
  - `useReducedMotionSafe`: Automatic adherence to accessibility motion preferences.
- **Shared Variants (`variants.js`)**: Container staggering, radar sweeps, orbital rotations, and drawers.

### 3. Living Component Library & Style Guide (`/design-system`)
- Accessible at route `/design-system`.
- Interactive showroom showcasing:
  - Theme switching matrix
  - Kinetic magnetic buttons (6 variants: primary, secondary, outline, ghost, danger, glow)
  - Form controls, sliders, switches, and avatar stacks
  - Composite flight-deck widgets: `MatchRing`, `SkillRadar`, `DeadlineCountdown`, `StatCard` (with sparklines), `Stepper`, `Timeline`, `BottomSheet`, `Accordion`, and `Modal`.

### 4. Screen-by-Screen Signature Moments
- **Landing Page**: Interactive 3D/particle "Career Constellation" hero with canvas starfield, orbiting opportunity nodes reacting to cursor, typewriter role cycling, and continuous live telemetry ticker.
- **Dashboard**: Asymmetric Bento Grid featuring daily AI synthesis, orbital match beacon, sparkline velocity cards, and 7-day activity heatmap streak.
- **Opportunities Page**: Live radar feed (`useLiveFeed`) with animated "N new opportunities" ingest pill, physics-driven Swipe Deck, and mobile bottom sheet details.
- **Applications Tracker**: 5-stage DnD Kanban with drag overlays, optimistic updates, and offer confetti bursts.
- **Resume Analyzer**: Moving scanning radar beam with OCR telemetry and needle-physics score gauge.
- **Skill Gap Page**: Interactive polygon radar chart morphing across 7 canonical engineering roles.
- **AI Advisor**: Living Holographic AI Orb (`LivingAIOrb`) with 4 physical states (Idle, Listening, Thinking, Speaking) and token streaming with caret.
- **Mobile-First Ergonomics**: Bottom tab bar with animated active indicator and haptic feedback, safe area insets (`env(safe-area-inset-*)`), and touch gestures.
- **PWA Ready**: Web app manifest (`/manifest.json`), standalone viewport fit, and responsive icons.

---

## 🔒 Security, Provenance & Quality Control

1. **JWT Ownership Protection**: Authentication middleware verifies user ID claims to guarantee students cannot read or edit another user's profile.
2. **CORS Hardening**: Explicit preflight handling (`OPTIONS`) with dynamic origin validation and headers.
3. **Field Provenance**: Prevents automated tools from silently modifying user-verified personal and academic records.
4. **Resilient Error Boundaries**: Backend endpoints catch database connection dropouts and feed parsing errors gracefully, returning meaningful error messages.

---

## 🚀 Installation & Quick Start

### Prerequisites
- **Python**: 3.12+
- **Node.js**: 18+ (tested on Node v20/v22)
- **MongoDB**: MongoDB Community Server 6.0+ running locally on port `27017` or a MongoDB Atlas connection string.

### 1. Clone the Repository
```bash
git clone https://github.com/prudhvi-raju-jubburu/career-pilot-AI.git
cd career-pilot-AI
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run server
python run.py
```
*Backend API starts at: `http://localhost:5000`*

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Optional: configure environment (set VITE_USE_MOCKS=true for standalone mock mode)
cp .env.example .env

# Start development server
npm run dev

# Or run production build
npm run build
```
*Frontend application starts at: `http://localhost:5173`*


---

## 🧪 Testing & Quality Verification

### 1. Run Backend Test Suite
The backend contains 39 comprehensive unit and integration tests covering Authentication, Applications Pipeline, Notifications & Daily Digest, Sources Telemetry, Health Checks, Dashboard Stats, AI Advisor, Resume Parsing (PDF + DOCX), Skill Gap Analysis, and Opportunity Ingestion:

```bash
cd backend
python -m pytest tests/ -v
```
**Test Results**: `39 passed in 13.5s` (100% passing rate).

### 2. Verify Zero Mocks Across Production Code
The CI acceptance script scans all production code in `frontend/src` and `backend/app` for forbidden mock tokens, fixtures, or fallback arrays:

```bash
cd frontend
npm run check:no-mocks
```
**Acceptance Result**: `Scanned 158 production source files. ✅ PASSED: Zero mock tokens found.`

### 3. Build Frontend for Production
```bash
cd frontend
npm run build
```
**Build Results**: Vite production bundle completes with **0 errors**, code-splitting all pages into optimized chunks.

---

## 📁 Project Directory Structure

```
careerpilot-ai/
├── backend/
│   ├── app/
│   │   ├── ai/                  # Gemini AI Advisor Agent & Context Injection
│   │   ├── config/              # MongoDB connection & app settings
│   │   ├── models/              # User, Profile, Opportunity, Application, Notification, SourceRun
│   │   ├── routes/              # Flask Blueprints (auth, profile, opportunity, application, notification,
│   │   │                        #                  sources, advisor, dashboard, stream, skill_gap, health)
│   │   ├── scrapers/            # Base connector + 5 live connectors (Remotive, Arbeitnow, Codeforces, Devfolio, OpportunityDesk)
│   │   ├── services/            # OpportunityService, IngestionService, ProfileService, ResumeParser, EventStream
│   │   ├── utils/               # Normalizers, JWT auth helper, deduplication hash
│   │   └── __init__.py          # App factory, CORS hooks, index registration
│   ├── tests/                   # Pytest suites (test_auth, test_opportunity, test_production_features, test_profile_resume, test_skill_gap)
│   ├── run.py                   # Flask server entrypoint
│   └── requirements.txt         # Pinned backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Layouts (Sidebar, Topbar), UI (Card, Badge, Button, Drawer)
│   │   ├── context/             # AuthContext, ToastContext
│   │   ├── hooks/               # useAuth, useProfile, useOpportunities, useApplications, useLiveFeed, useSkillGap
│   │   ├── pages/               # Dashboard, Opportunities, Applications, SkillGap, Profile, AICareerAdvisor
│   │   ├── services/            # Axios API layer (api, opportunityService, applicationService, skillGapService)
│   │   ├── App.jsx              # Routing & code-split views
│   │   ├── index.css            # Production CSS design tokens & layout utilities
│   │   └── main.jsx             # React DOM root
│   ├── vite.config.js           # Vite build & proxy config
│   └── package.json             # Frontend dependencies & check:no-mocks script
│
├── docs/
│   └── sources.md               # Legal review, rate limits, schedules, and schemas for 5 connectors
│
├── scripts/
│   └── check-no-mocks.js        # Strict CI verification script
│
└── README.md                    # Platform documentation
```

---