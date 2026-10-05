# CareerPilot AI — Autonomous Career Discovery & Student Readiness Platform

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-PyMongo-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**CareerPilot AI** is a production-grade, AI-augmented career opportunity discovery and skill readiness platform built specifically for university students and early-career software engineers. 

The platform continuously discovers, normalizes, validates, deduplicates, and serves high-impact student opportunities (internships, fellowships, hackathons, coding contests, and entry-level engineering roles). It pairs discovery with a deterministic student profile engine, resume-to-profile provenance tracking, and an industry-aligned skill gap roadmap system.

---

## 📑 Table of Contents

- [Core Platform Capabilities](#-core-platform-capabilities)
- [System Architecture](#-system-architecture)
- [Canonical Data Models & MongoDB Schema](#-canonical-data-models--mongodb-schema)
- [Ingestion Pipeline & Source Adapters](#-ingestion-pipeline--source-adapters)
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
- **Canonical Schema Normalization**: Standardizes diverse opportunity feeds into uniform types (`internship`, `fellowship`, `hackathon`, `coding_contest`, `scholarship`, `job`) and categories (`software`, `artificial_intelligence`, `data`, `cloud`, etc.).
- **Deterministic Deduplication**: Employs SHA-256 fingerprint hashing (`metadata.raw_hash`) combining source identity, external IDs, normalized titles, and application URLs.
- **Automated Lifecycle Expiration**: Built-in background engine marks opportunities with past deadlines as `expired`, preventing stale listings from cluttering student feeds.
- **Source Adapter Isolation**: Pluggable provider architecture (`OpportunitySource`) where third-party feed timeouts or failures never crash the platform.

### 2. Student Profile & Resume Provenance (Phase 1)
- **Field-Level Provenance (`field_sources`)**: Every attribute in a student's profile tracks its exact origin (`manual`, `resume`, or `system`) along with updated timestamps.
- **Manual-Field Protection**: User-verified edits are safeguarded from being overwritten by subsequent automated resume parsers.
- **Deterministic Profile Completion**: Weighted algorithm evaluates personal details, academic metrics (CGPA, degree, branch), skills, and career preferences, giving actionable completion targets.

### 3. Skill Gap & Personalized Learning Engine
- **Target Role Benchmarking**: Compares student profiles against real-world tech specifications (Full Stack Developer, Software Engineer, AI/ML Researcher, etc.).
- **Skill Classification**: Categorizes competencies into `MATCHED`, `PARTIAL` (prerequisites fulfilled), and `MISSING`.
- **Dependency-Ordered Roadmap**: Sequences learning paths into **Now** $\to$ **Next** $\to$ **After That**, complete with verified documentation links, tutorial resources, and capstone project specifications.

### 4. Production Dashboard & Analytics
- **Responsive 2-Column Grid**: Dynamic desktop/tablet/mobile layout maximizing screen utilization without arbitrary width constraints.
- **Live Student Metrics**: Real-time counters for verified opportunities available, applications in progress, profile completion percentage, and target role readiness scores.
- **Source Transparency**: Explicit attribution badges ("Company Careers", "Curated Student Feed") and direct links to original verified application portals.

---

## 🏛️ System Architecture

```
                                  ┌──────────────────────────────┐
                                  │      React 18 SPA Client     │
                                  │  (Vite + React Router + CSS) │
                                  └──────────────┬───────────────┘
                                                 │ HTTP / REST APIs
                                                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                Flask 3.0 Application Server                            │
│                                                                                        │
│   ┌─────────────────────┐   ┌──────────────────────────┐   ┌───────────────────────┐   │
│   │   Auth & Security   │   │  Opportunities Blueprint │   │  Skill Gap Blueprint  │   │
│   │  (JWT + Middleware) │   │  (Search, Filter, Paging)│   │  (Roadmaps & Progress)│   │
│   └─────────────────────┘   └─────────────┬────────────┘   └───────────────────────┘   │
│                                           │                                            │
│   ┌───────────────────────────────────────┴────────────────────────────────────────┐   │
│   │                         Business Logic & Ingestion Layer                       │   │
│   │                                                                                │   │
│   │   ┌───────────────────┐    ┌────────────────────┐    ┌─────────────────────┐   │   │
│   │   │ OpportunityService│    │  ProfileService    │    │  SkillGapService    │   │   │
│   │   └─────────▲─────────┘    └────────────────────┘    └─────────────────────┘   │   │
│   │             │                                                                  │   │
│   │   ┌─────────┴─────────┐    ┌────────────────────┐    ┌─────────────────────┐   │   │
│   │   │ Ingestion Pipeline│    │ APScheduler Daemon │    │ Skill Normalizer    │   │   │
│   │   └─────────▲─────────┘    └────────────────────┘    └─────────────────────┘   │   │
│   │             │                                                                  │   │
│   │   ┌─────────┴─────────┐    ┌────────────────────┐                              │   │
│   │   │ Source Adapters   │───►│ Sample Source      │                              │   │
│   │   │ (OpportunitySource│───►│ Public Tech Feeds  │                              │   │
│   │   └───────────────────┘    └────────────────────┘                              │   │
│   └───────────────────────────────────────┬────────────────────────────────────────┘   │
└───────────────────────────────────────────┼────────────────────────────────────────────┘
                                            │ PyMongo Driver
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MongoDB 6.0+ Database                                │
│                                                                                        │
│   • opportunities       (Unique hash, multi-key skills, compound status+deadline)      │
│   • student_profiles    (Unique user_id, field provenance, verified flags)             │
│   • users               (Unique email, bcrypt hashed passwords)                        │
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

### System (`/api/health`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status & MongoDB ping |

---

## 🎨 Frontend Architecture & Design System

- **Framework**: React 18 SPA built with Vite for sub-second hot module reloading.
- **Navigation**: React Router DOM v6 with lazy-loaded route chunks and suspense skeleton fallbacks.
- **Styling Architecture**: Vanilla CSS using CSS variables (`--color-surface`, `--primary`, `--radius-lg`, `--shadow-raised-lg`). Single cohesive educational theme without jarring light/dark mode flash.
- **Accessibility & UX**:
  - Full keyboard navigation and touch-friendly controls.
  - Zero layout shift during data fetching via structured Skeleton cards.
  - Debounced search inputs (300ms) avoiding redundant network roundtrips.
  - Contextual Toast alerts and responsive slide-out opportunity drawers.

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

# Start development server
npm run dev
```
*Frontend application starts at: `http://localhost:5173`*

---

## 🧪 Testing & Quality Verification

### Run Backend Test Suite
The backend contains comprehensive unit and integration tests covering Authentication, Profiles, Resume Parsing, Skill Gap Calculation, Opportunity Ingestion, Deduplication, and Expiration:

```bash
cd backend
pytest -v
```
**Test Results**: `34 passed in 4.5s` (100% passing rate).

### Build Frontend for Production
```bash
cd frontend
npm run build
```
**Build Results**: Vite production bundle completes in ~3 seconds with **0 errors**.

---

## 📁 Project Directory Structure

```
careerpilot-ai/
├── backend/
│   ├── app/
│   │   ├── config/              # MongoDB connection & app settings
│   │   ├── models/              # User, Profile, Opportunity, LearningProgress models
│   │   ├── routes/              # Flask Blueprints (auth, profile, opportunity, skill_gap)
│   │   ├── scrapers/            # Base adapter, sample feed, public feed providers
│   │   ├── services/            # OpportunityService, ProfileService, SkillGapService
│   │   ├── utils/               # Normalizers, JWT auth helper, deduplication hash
│   │   └── __init__.py          # App factory, CORS hooks, index registration
│   ├── tests/                   # Pytest suites (test_auth, test_opportunity, test_profile)
│   ├── run.py                   # Flask server entrypoint
│   └── requirements.txt         # Pinned backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Layouts (Sidebar, Topbar), UI (Card, Badge, Button, Drawer)
│   │   ├── context/             # AuthContext, ToastContext
│   │   ├── hooks/               # useAuth, useProfile, useOpportunities, useSkillGap
│   │   ├── pages/               # Dashboard, Opportunities, SkillGap, Resume, Profile
│   │   ├── services/            # Axios API wrappers (opportunityService, profileService)
│   │   ├── App.jsx              # Routing & code-split views
│   │   ├── index.css            # Production CSS design tokens & layout utilities
│   │   └── main.jsx             # React DOM root
│   ├── vite.config.js           # Vite build & proxy config
│   └── package.json             # Frontend dependencies
│
└── README.md                    # Platform documentation
```

---