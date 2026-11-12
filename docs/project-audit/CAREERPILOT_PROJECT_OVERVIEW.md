# CareerPilot AI — Executive Project Overview

## 1. Document Control & Metadata
- **Project Name**: CareerPilot AI
- **Repository Location**: `d:\careerpilot_ai`
- **Audit Date**: November 2026
- **Auditor Roles**: Senior Software Architect, Technical Product Manager, Business Analyst, Full-Stack Engineering Lead, AI/ML Engineer, Database Architect, Application Security Auditor
- **Implementation Status**: Feature-complete in local development; production migration completed with live external connectors, zero mocks in production code, and comprehensive cascading data isolation.

---

## 2. Multi-Level Project Explanation

### Level 1 — One-Line Explanation (Non-Technical)
> **CareerPilot AI is an intelligent career copilot that helps college students discover verified internships and jobs, match their academic skills to job criteria, practice AI-simulated interviews, and track their entire job application journey in one place.**

---

### Level 2 — One-Minute Explanation (Student & Evaluator Focus)
Finding relevant jobs and internships during college is overwhelming: opportunities are scattered across hundreds of job boards, eligibility criteria like graduation year, CGPA, and degree branch are buried in dense text, resumes fail automated screening systems (ATS), and students lack objective feedback when preparing for technical and HR interviews.

**CareerPilot AI** solves this by unifying the entire career readiness lifecycle:
1. **Centralized Discovery**: It continuously ingests and validates real opportunities from university hiring platforms (Unstop), hackathon networks (Devfolio), coding competitions (Codeforces), ATS feeds (Greenhouse, Lever), and remote job platforms (Remotive), filtering out stale or inaccessible listings.
2. **Transparent Eligibility & Scoring**: It compares the student's profile (education, CGPA, graduation batch, branch) against job requirements using deterministic hard rules, ensuring students never waste time on roles for which they are ineligible.
3. **Evidence-Based Skill Gaps**: Rather than just checking whether a skill is written on a resume, it distinguishes between *demonstrated skills* (verified in projects and work experience) and *listed skills*, generating structured study paths.
4. **Interactive Practice & Tracking**: It provides a 200-question proctored mock testing arena, an interactive voice/text AI Interview Simulator, a drag-and-drop Kanban application tracker, and a real-time conversational AI Career Copilot with streaming assistance.

---

### Level 3 — Comprehensive Ecosystem Explanation
CareerPilot AI is structured as a full-stack, event-driven web application comprising a modern React 18 single-page application (SPA), a Flask 3.0 microservices backend, MongoDB document storage, and hybrid artificial intelligence (Google Gemini 2.5 Flash and OpenAI GPT-4o-mini with deterministic fallbacks).

The ecosystem spans nine integrated subsystems:
1. **Authentication & Session Security**: JWT-based stateless authentication with password hashing (Werkzeug PBKDF2/SHA256), token lifecycle management, role-based access control (`student` vs. `admin`), and session deactivation.
2. **Student Profile & Resume Provenance**: Dual-engine resume text extraction (PDF via `pypdf`, DOCX via `python-docx`), structured entity extraction via Gemini AI, human-in-the-loop review mode (`/profile/review`), and field-level provenance tracking (`field_sources`) that guarantees automated parsers never overwrite user-confirmed manual entries.
3. **Opportunity Discovery & Multi-Source Ingestion Pipeline**: Live external connectors with India-first tech hub normalization (Bengaluru, Hyderabad, Pune, Delhi NCR, Mumbai, Chennai) and strict India eligibility checks (`is_india_eligible`), 5-layer deduplication (SHA-256 fingerprinting, canonical URLs, and fuzzy string similarity), and automatic lifecycle expiration.
4. **Explainable Recommendation & Deterministic Eligibility Engine**: A two-phase filtering pipeline: Phase 1 enforces strict, deterministic hard-eligibility rules (deadlines, graduation year, degree branch, CGPA, backlogs) with 0% false positives; Phase 2 calculates a 5-factor weighted fit score (35% skill relevance, 25% role preference, 15% project experience, 15% education fit, 10% location preference) accompanied by grounded natural-language explanations.
5. **Evidence-Based Skill Gap Analysis**: A diagnostic engine mapping 12+ student target engineering roles against canonical industry skill requirements across 7 categories. It evaluates evidence qualification (`demonstrated` from projects/internships, `coursework` from university syllabus, and `listed` from resume keywords) and computes readiness percentages with actionable learning roadmaps.
6. **Application Lifecycle Management**: A full-featured Kanban board (`Saved`, `Applied`, `Interviewing`, `Offer`, `Rejected`), calendar integration with `.ics` export, timeline event auditing, deadline countdowns, and celebratory visual effects (confetti).
7. **Proctored Mock Test Engine**: A timed examination portal with full-screen enforcement, anti-cheating tab-switch detection, a curated bank of 200 multi-choice questions across 8 computer science disciplines, real-time question palette navigation, and instant diagnostic performance reports.
8. **AI-Powered Interview Simulator**: A proctored, multi-modal practice suite supporting speech-to-text (Web Speech API) and text-to-speech audio playback. It simulates 5 interview tracks (*Technical*, *Coding Discussion*, *Project Deep-Dive*, *STAR Behavioral*, and *Weak-Topic Revision*), grading responses across 6 evaluative dimensions with personalized remediation plans.
9. **Context-Aware AI Career Copilot**: A real-time conversational advisor utilizing a Retrieval-Augmented Generation (RAG) architecture. It injects the student's verified profile, projects, skill gaps, and applications into the prompt context, features prompt-injection defense delimiters, and streams tokens incrementally via Server-Sent Events (SSE).

---

## 3. Explicit Boundaries: What CareerPilot AI Does NOT Do

To maintain academic and professional integrity, CareerPilot AI explicitly does **NOT**:
1. **Guarantee Employment or Selection**: AI scores, match recommendations, and simulator ratings are diagnostic preparation tools. They do not represent official screening scores from employers nor guarantee job offers.
2. **Impersonate Real Corporate Interviewers**: The AI Interview Simulator clearly displays a legal disclaimer stating that questions are study aids synthesized from job descriptions and public engineering standards, not leaked or official employer interview questions.
3. **Fabricate Credentials or Ghostwrite Untruthful Resumes**: The platform enforces provenance tracking and does not artificially inject unverified claims or false experience into student resumes.
4. **Submit Applications Automatically Without Student Agency**: The platform does not perform automated "bot" submissions or bypass company application portals; it provides direct canonical links to official application endpoints.
5. **Trade or Expose Student Data**: The platform implements cross-user data isolation, strips internal file paths from API responses, prevents SSRF attacks, and provides a cascading, permanent account deletion mechanism.

---

## 4. Problem Statement & Solution Mapping

| Student Problem | Real-World Impact | CareerPilot AI Solution | Implementation Mechanism | Current Operational Limitations |
|---|---|---|---|---|
| **Scattered Opportunities** | Students check 10+ websites daily (Unstop, Devfolio, LinkedIn, ATS boards) and miss critical openings. | Centralized multi-source ingestion pipeline. | Automated background connectors for Unstop, Devfolio, Codeforces, Remotive, and ATS boards with deduplication. | Certain major job portals (e.g. LinkedIn, Naukri) require private enterprise APIs or dynamic browser sessions not yet integrated. |
| **Unclear Eligibility Criteria** | Students spend hours applying only to be disqualified by graduation batch or branch filters. | Deterministic Hard Eligibility Engine. | Pass/fail evaluation of graduation year, CGPA, branch, and deadline before recommendation scoring. | Opportunities with ambiguous or unstated criteria are labeled `needs_review` rather than auto-approved. |
| **Resume & ATS Mismatches** | Resumes are formatted improperly or miss foundational keywords, causing ATS rejections. | Dual-format resume parsing and review portal. | `pypdf` + `python-docx` text extraction, Gemini structured analysis, and human-in-the-loop review (`/profile/review`). | Complex multi-column graphic resumes or scanned raster images without OCR text layers cannot be extracted reliably. |
| **Superficial Skill Visibility** | Students believe having a keyword on a resume is sufficient for technical screening. | Evidence-based skill gap categorization. | Separates `demonstrated` (project/work backed) from `listed` and `coursework` skills with canonical category radar charts. | Skill taxonomies rely on a curated 12-role catalog; bespoke emerging niche titles map to the closest canonical parent. |
| **Chaotic Application Tracking** | Missed deadlines, unorganized interview rounds, lost notes across spreadsheets. | Visual Kanban tracker & Calendar sync. | Drag-and-drop Kanban (`@dnd-kit`), timeline audits, deadline reminders (48h/24h), and `.ics` calendar export. | External calendar two-way synchronization (Google Calendar OAuth) is file-based export only; no live two-way webhook sync. |
| **Inadequate Interview Preparation** | Students memorize generic answers and fail when asked deep questions about their own projects. | Grounded Interview Simulator & 200-question Mock Arena. | Context-aware question generation synthesizing job requirements with candidate projects, speech recognition, and 6-dimension scoring. | Browser speech recognition depends on Chrome/Edge Web Speech API; voice input is unavailable on older or restricted browsers. |
| **Generic Career Advice** | Chatbots offer vague advice with zero knowledge of student coursework or application status. | Context-Aware RAG Copilot with Token Streaming. | Injects verified student profile, applications, and skill gaps into LLM prompts using delimiters, streaming via SSE. | LLM generation is bounded by third-party API quotas and network latency; falls back to deterministic guidance if APIs fail. |

---

## 5. Target Audience & User Personas

### 1. The Computer Science / Engineering Student (Primary User)
- **Profile**: 2nd to 4th year B.Tech/B.E./BCA/MCA student preparing for campus placements, off-campus hiring, hackathons, and summer internships.
- **Goals**: Discover verified tech internships in India, benchmark readiness against target job descriptions, identify missing technical fundamentals (DSA, DBMS, OS, System Design), and practice mock interviews.
- **Responsibilities**: Keep academic profile accurate, upload resume for diagnostic parsing, review and confirm extraction diffs, practice interview tracks, and update application stages.

### 2. The Early-Career Software Engineer (Secondary User)
- **Profile**: Recent graduate or junior engineer (0-2 years experience) seeking entry-level software development roles (SDE-1, Frontend, Backend, Full-Stack, DevOps, Data Analyst).
- **Goals**: Transition from university projects to production-grade engineering roles, identify gaps in distributed systems and cloud tooling, and maintain a structured pipeline of job applications.

### 3. The Platform Administrator (Operational Role)
- **Profile**: System administrator, university placement coordinator, or platform owner.
- **Responsibilities**: Monitor real-time system KPIs, trigger and review external ingestion source sync runs, inspect audit logs, manage user account states (active/suspended), review student feedback, and oversee system reliability.

---

## 6. Core Value Proposition & Differentiation

```
                       Traditional Job Boards               CareerPilot AI
              ┌──────────────────────────────────────┬──────────────────────────────────────┐
   Data       │ Static, user-submitted job ads;      │ Continuous live multi-source         │
   Source     │ heavy sponsored listings & spam.     │ ingestion with strict India-tech     │
              │                                      │ eligibility & SHA-256 deduplication. │
              ├──────────────────────────────────────┼──────────────────────────────────────┤
   Matching   │ Keyword search with zero academic    │ 2-phase decoupled evaluation:        │
   Model      │ or eligibility awareness.            │ Deterministic hard rules + 5-factor   │
              │                                      │ explainable fit scoring.             │
              ├──────────────────────────────────────┼──────────────────────────────────────┤
   Skill      │ Binary tag matching: either you      │ Provenance-aware: separates          │
   Analysis   │ have the keyword or you don't.       │ demonstrated (projects) from listed  │
              │                                      │ skills; provides learning roadmaps.  │
              ├──────────────────────────────────────┼──────────────────────────────────────┤
   Interview  │ None, or expensive third-party       │ Free, built-in 200-question exam     │
   Readiness  │ coaching services.                   │ arena + voice-enabled proctored AI   │
              │                                      │ interview simulator.                 │
              ├──────────────────────────────────────┼──────────────────────────────────────┤
   AI         │ Generic standalone chatbot unaware   │ RAG-grounded Copilot injecting real  │
   Guidance   │ of your actual resume or status.     │ profile, projects, and active apps.  │
              └──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 7. High-Level Technology Stack Summary

- **Frontend**: React 18.3.1, Vite 5.4.11, React Router 6.28.1, Framer Motion 14, Recharts 3.10.1, Socket.io-client 4.8.4, Axios 1.7.9, `@dnd-kit`.
- **Backend**: Python 3.12, Flask 3.0+, PyMongo 4.6+, PyJWT 2.8+, Flask-SocketIO 5.3+, APScheduler 3.10.4, `pypdf` 4.0+, `python-docx` 1.0+.
- **Database**: MongoDB 7.0+ (NoSQL document store with 20 dedicated collections, compound indexing, and zero relational joins).
- **AI Infrastructure**: Google Gemini 2.5 Flash via `google-genai` SDK (primary) with OpenAI GPT-4o-mini (secondary fallback) and deterministic rule-based generators (safety fallback).
- **Protocols**: RESTful JSON APIs, Server-Sent Events (SSE) for streaming updates, and WebSockets (Socket.IO) for real-time notifications.

