# CareerPilot AI — Feature-by-Feature Documentation

This document provides a comprehensive, ground-truth inventory of every major feature implemented in the **CareerPilot AI** repository (`d:\careerpilot_ai`).

---

## A. Authentication & Authorization

### 1. User Registration & Account Provisioning
- **Purpose**: Enables new students to create a secure account with an email address, password, and basic identity attributes.
- **Problem It Solves**: Prevents unauthorized access and establishes a distinct user identity for personal profile and application tracking.
- **How User Accesses It**: Navigates to `/register` or clicks "Get Started" on the public landing page (`/`).
- **Frontend Implementation**: `RegisterPage.jsx` renders an interactive multi-field form with client-side validation (email format, minimum password length, password confirmation match).
- **Backend Implementation**: `auth_bp.route("/register", methods=["POST"])` in `app/routes/auth.py`. Hashes passwords with Werkzeug (`generate_password_hash`), creates a document in `users`, and auto-provisions a blank student profile in `student_profiles`.
- **API Endpoints**: `POST /api/auth/register`
- **Database Collections Involved**: `users`, `student_profiles`
- **AI / External Integrations**: None. Purely deterministic cryptographic operations.
- **Internal Workflow**:
  1. Frontend submits `{ name, email, password, role }`.
  2. Backend validates fields and normalizes email (`lower().strip()`).
  3. `UserModel.find_by_email()` checks for uniqueness; returns 409 if email already exists.
  4. Generates password hash using PBKDF2/SHA256 (`method='pbkdf2:sha256'`).
  5. Inserts user document with default status `"active"` and role `"student"`.
  6. Auto-creates empty profile in `student_profiles` bound to the new `user_id`.
  7. Issues signed JWT and returns 201 Created.
- **Validation & Security**: Password minimum length (8 chars), email regex validation, strictly forbids client-supplied `role="admin"` during public registration.
- **Error Handling**: Returns `400 Bad Request` on missing fields, `409 Conflict` on duplicate email, `500 Internal Error` on database failure.
- **Implementation Status**: Implemented and tested.
- **Known Limitations**: Email verification (activation link sent via SMTP) is not enforced during initial sign-up.
- **Relevant Source Files**: `frontend/src/pages/RegisterPage.jsx`, `backend/app/routes/auth.py`, `backend/app/models/user.py`.

---

### 2. User Login, JWT Generation & Session Authentication
- **Purpose**: Authenticates returning students and administrators, returning a signed JSON Web Token (JWT).
- **Problem It Solves**: Stateless, scalable authentication across API calls and WebSocket connections without server-side session bloat.
- **How User Accesses It**: Navigates to `/login`.
- **Frontend Implementation**: `LoginPage.jsx` handles submission, saves JWT to browser `localStorage`, initializes Socket.IO via `socket.js`, and redirects to `/dashboard`.
- **Backend Implementation**: `auth_bp.route("/login", methods=["POST"])` in `app/routes/auth.py`. Uses `UserModel.verify_password()` and `generate_token()`.
- **API Endpoints**: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/refresh`
- **Database Collections Involved**: `users`
- **AI / External Integrations**: None.
- **Internal Workflow**:
  1. Client sends `{ email, password }`.
  2. Queries `users` collection by normalized email.
  3. Checks `user["status"] == "active"` (rejects suspended accounts with 403).
  4. Verifies hash using `werkzeug.security.check_password_hash`.
  5. Updates `last_login_at` timestamp.
  6. Creates signed JWT containing `{ sub: user_id, email, iat, exp }`.
  7. Returns token and user summary.
- **Validation & Security**: Timing-safe password comparison; tokens expire in 24 hours (`JWT_EXPIRATION_HOURS`); secret key configured via environment variable `JWT_SECRET`.
- **Error Handling**: `401 Unauthorized` for incorrect password or non-existent user (generic message prevents account enumeration).
- **Implementation Status**: Implemented and tested.
- **Known Limitations**: JWT revocation is stateless; token blacklisting is not implemented in a Redis cache (mitigated by immediate user status check in `@token_required` and Socket.IO disconnect on deactivation).
- **Relevant Source Files**: `backend/app/routes/auth.py`, `backend/app/utils/auth.py`, `frontend/src/services/api.js`.

---

### 3. Role-Based Access Control (RBAC) & Administrative Guards
- **Purpose**: Restricts administrative capabilities (KPI dashboards, user moderation, ingestion source triggers) to verified admin accounts.
- **Problem It Solves**: Prevents students from tampering with external sources, viewing other users' logs, or escalating privileges.
- **How User Accesses It**: Accessing `/admin` routes or invoking `/api/admin/*` endpoints.
- **Frontend Implementation**: `AdminRoute.jsx` checks `user.role === 'admin'`; redirects unauthorized students to `/dashboard`.
- **Backend Implementation**: `@admin_required` decorator in `backend/app/utils/auth.py`. Verifies JWT and checks `user["role"] == "admin"`.
- **API Endpoints**: All endpoints under `/api/admin/*`.
- **Database Collections Involved**: `users`, `audit_logs`
- **AI / External Integrations**: None.
- **Internal Workflow**:
  1. Request passes Authorization Bearer token.
  2. `@admin_required` decodes token and extracts `user_id`.
  3. Queries database to fetch fresh user document.
  4. Confirms `user["role"] == "admin"`.
  5. If role is not admin, halts execution immediately with `403 Forbidden`.
- **Validation & Security**: Role is verified against the database record on every single privileged request, not trusted merely from token claims.
- **Error Handling**: `401 Unauthorized` if token missing; `403 Forbidden` if role is student or account is suspended.
- **Implementation Status**: Implemented and tested in `test_admin_security.py`.
- **Known Limitations**: System currently supports binary roles (`student` vs. `admin`); no fine-grained permission matrix (e.g., read-only placement officer vs. super-admin).
- **Relevant Source Files**: `backend/app/utils/auth.py`, `backend/app/routes/admin.py`, `frontend/src/components/AdminRoute.jsx`.

---

## B. Student Profile Management

### 1. Multi-Section Academic & Career Profile Management
- **Purpose**: Stores student personal info, education records, verified skills, project history, work experience, and career preferences.
- **Problem It Solves**: Incomplete or scattered student data makes accurate job matching and skill-gap identification impossible.
- **How User Accesses It**: Navigates to `/profile` in the top navigation or sidebar.
- **Frontend Implementation**: `ProfilePage.jsx` renders a tabbed interface for Personal, Education, Skills, Projects, Experience, and Preferences with completion meter and inline edit forms.
- **Backend Implementation**: `profile_bp` in `backend/app/routes/profile.py` delegating to `ProfileModel` in `backend/app/models/profile.py`.
- **API Endpoints**: `GET /api/profile`, `PUT /api/profile`, `PATCH /api/profile`
- **Database Collections Involved**: `student_profiles`
- **AI / External Integrations**: None.
- **Internal Workflow**:
  1. Frontend fetches current profile via `GET /api/profile`.
  2. Backend looks up profile matching `current_user["_id"]`.
  3. Updates recalculate overall profile completion percentage (0 to 100%) based on filled sections.
  4. Updates persist with field provenance set to `"manual"` and current UTC timestamp.
- **Validation & Security**: User ownership enforced strictly by pulling `user_id` from verified JWT. Students cannot view or update another student's profile.
- **Error Handling**: Returns `404 Not Found` if profile document is missing; `400 Bad Request` if payload is not a valid JSON dictionary.
- **Implementation Status**: Implemented and tested.
- **Known Limitations**: Profile attachments (certificates, degree transcripts) are stored as external URL strings rather than uploaded documents.
- **Relevant Source Files**: `frontend/src/pages/ProfilePage.jsx`, `backend/app/routes/profile.py`, `backend/app/models/profile.py`.

---

### 2. Field-Level Provenance & Manual Edit Preservation
- **Purpose**: Tracks the origin of every profile field (`manual`, `resume`, or `system`) to prevent automated parsers from overwriting user-verified details.
- **Problem It Solves**: When a student fixes an extracted typo, re-uploading a resume frequently resets their manual corrections in conventional systems.
- **How User Accesses It**: Automatic background logic during profile updates and resume extraction confirmation.
- **Frontend Implementation**: Highlighted badges on the review screen (`ProfileReviewPage.jsx`) showing whether a field is from resume extraction or manually edited.
- **Backend Implementation**: `ProfileModel.confirm_resume_extraction()` and `field_sources` sub-document in `ProfileModel`.
- **API Endpoints**: `POST /api/resume/confirm-extraction`
- **Database Collections Involved**: `student_profiles`
- **AI / External Integrations**: None.
- **Internal Workflow**:
  1. `student_profiles` document maintains a `field_sources` mapping (e.g., `{"education.cgpa": "manual", "skills": "resume"}`).
  2. When a resume is analyzed, extracted values are staged rather than immediately applied.
  3. During confirmation, backend checks if student chose to override existing manual fields.
  4. If a field was marked `"manual"`, it is only overwritten if the student explicitly checks the replacement box.
- **Validation & Security**: Deterministic dictionary merging; prevents data corruption.
- **Error Handling**: Validation errors returned if incoming payload format is malformed.
- **Implementation Status**: Implemented and tested in `test_profile_resume.py`.
- **Known Limitations**: Provenance tracking is granular to top-level and first-nested fields; deeply nested sub-arrays track provenance at the array level.
- **Relevant Source Files**: `backend/app/models/profile.py`, `backend/app/routes/resume.py`.

---

## C. Resume Management

### 1. Secure Resume Document Upload & Isolated Storage
- **Purpose**: Accepts and stores student resumes in PDF or DOCX format on local disk.
- **Problem It Solves**: Students need to upload physical resume files for automated parsing and ATS quality analysis.
- **How User Accesses It**: `/profile` upload widget or `/resume` page.
- **Frontend Implementation**: Drag-and-drop file dropzone in `frontend/src/pages/ProfilePage.jsx` and `ResumeUploadPage.jsx`.
- **Backend Implementation**: `resume_bp.route("/upload", methods=["POST"])` in `backend/app/routes/resume.py`.
- **API Endpoints**: `POST /api/resume/upload`, `GET /api/resume`
- **Database Collections Involved**: `student_profiles`
- **AI / External Integrations**: None at upload time.
- **Internal Workflow**:
  1. Client sends multipart form-data with key `"resume"`.
  2. Checks file extension against allowed set: `{"pdf", "docx"}`.
  3. Reads file bytes and verifies size does not exceed 10 MB (`10 * 1024 * 1024`).
  4. Resolves isolated storage path: `backend/uploads/resumes/{user_id}/{secure_filename}`.
  5. Saves file to disk and records metadata in profile (`fileName`, `fileSize`, `uploadedAt`, `parsed: False`, `analysisStatus: "pending"`).
  6. When returning metadata to client, explicitly strips internal `filePath` from response JSON for security.
- **Validation & Security**: Sanitizes filenames with `werkzeug.utils.secure_filename`; ensures user-isolated sub-folders; enforces 10 MB ceiling; never serves raw files via unauthenticated endpoints.
- **Error Handling**: `400 Bad Request` on missing file or disallowed extension; `400 Bad Request` on file size > 10 MB.
- **Implementation Status**: Implemented and tested.
- **Known Limitations**: Storage is local disk-based; cloud object storage (AWS S3, Cloudinary) is not provisioned in the current environment.
- **Relevant Source Files**: `backend/app/routes/resume.py`, `backend/app/services/resume_parser.py`.

---

### 2. Dual-Engine Text Extraction & Gemini Structured Analysis
- **Purpose**: Extracts raw text from PDF/DOCX resumes and parses structured career entities (skills, education, projects, work experience) using Gemini AI.
- **Problem It Solves**: Converts unstructured resume prose into machine-readable data for matching and skill-gap evaluation.
- **How User Accesses It**: Automatic trigger after upload or clicking "Re-analyze Resume" on `/profile`.
- **Frontend Implementation**: `ProfileReviewPage.jsx` displays side-by-side comparison cards (Current Profile vs. Extracted Resume Data).
- **Backend Implementation**: `ResumeParserService.extract_text()` in `app/services/resume_parser.py` and `ResumeAnalyzerService.analyze_resume_text()` in `app/ai/resume_analyzer.py`.
- **API Endpoints**: `POST /api/resume/analyze`
- **Database Collections Involved**: `student_profiles`
- **AI / External Integrations**: `pypdf` (PDF extraction), `python-docx` (DOCX extraction), Google Gemini 2.5 Flash via `AIService`.
- **Internal Workflow**:
  1. `ResumeParserService` determines file type and extracts textual content.
  2. Binds extracted text within `<<<UNTRUSTED_STUDENT_CONTEXT>>>` delimiters.
  3. Submits prompt to `AIService.generate_structured_json()` requesting strict JSON matching the student profile schema.
  4. If Gemini fails or times out, falls back to OpenAI GPT-4o-mini; if both fail, invokes deterministic regex fallback extractor.
  5. If `save=false` or `review=true` parameter is passed, returns extracted data to frontend without mutating the profile.
  6. Frontend displays extraction review page allowing student to select fields to merge.
- **Validation & Security**: Delimiter isolation defends against prompt injections embedded inside student resumes; structured JSON schema enforced.
- **Error Handling**: Returns `422 Unprocessable Entity` if resume contains unparseable binary data; `500 Internal Error` if all extractors fail.
- **Implementation Status**: Implemented and tested in `test_profile_resume.py`.
- **Known Limitations**: Scanned image-only PDFs lacking embedded text layers cannot be extracted without an OCR preprocessing engine.
- **Relevant Source Files**: `backend/app/services/resume_parser.py`, `backend/app/ai/resume_analyzer.py`, `backend/app/routes/resume.py`.

---

## D. Opportunity Discovery & Ingestion

### 1. Multi-Source Opportunity Ingestion Pipeline
- **Purpose**: Ingests, normalizes, and refreshes real jobs, internships, hackathons, and competitive programming contests from multiple external web platforms.
- **Problem It Solves**: Eliminates manual job posting; keeps opportunity database fresh with zero fabricated mock listings.
- **How User Accesses It**: Background task; students view results on `/opportunities` and `/dashboard`.
- **Frontend Implementation**: Live feed on `/dashboard` and opportunity catalog with search/filter controls on `/opportunities`.
- **Backend Implementation**: `OpportunityIngestionService` in `app/services/ingestion_service.py` coordinating 6 specialized connectors (`UnstopConnector`, `DevfolioConnector`, `RemotiveConnector`, `CodeforcesConnector`, `ATSJobBoardConnector`, `ScholarshipConnector`).
- **API Endpoints**: `POST /api/sources/sync` (Admin trigger), `GET /api/sources/status`
- **Database Collections Involved**: `opportunities`, `source_runs`, `companies`
- **AI / External Integrations**: Live HTTP REST queries to Unstop, Devfolio, Remotive, Codeforces, and public ATS endpoints.
- **Internal Workflow**:
  1. Connectors fetch raw opportunity listings over HTTP with custom User-Agent headers.
  2. Connectors normalize listings into standardized opportunity dictionaries.
  3. `is_india_eligible()` filters out non-India, non-remote listings.
  4. Validates required schema fields (title, company, type, url).
  5. `DeduplicationService.find_duplicate()` checks for existing matches across 5 layers.
  6. If existing match found, executes deterministic field merge; if new, inserts new document into `opportunities`.
  7. Newly accepted records are broadcast via `EventStreamManager` to active SSE clients.
  8. Records execution metrics in `source_runs`.
- **Validation & Security**: Outbound HTTP requests use strict timeouts (10s); rate limiting prevents IP banning; circuit breaker trips after 3 consecutive failures.
- **Error Handling**: Connector failures are isolated; a failure in Unstop does not halt ingestion from Devfolio or Remotive.
- **Implementation Status**: Implemented and verified with 5 live connectors.
- **Known Limitations**: Headless browser automation (Playwright/Selenium) is not utilized, restricting ingestion to public JSON APIs and feed endpoints.
- **Relevant Source Files**: `backend/app/services/ingestion_service.py`, `backend/app/scrapers/base.py`, `backend/app/services/dedup_service.py`.

---

### 2. Opportunity Search, Filtering & Pagination
- **Purpose**: Allows students to search and filter opportunities by keyword, role type, work mode, and eligibility status.
- **Problem It Solves**: Helps students quickly find relevant openings without scrolling through hundreds of irrelevant listings.
- **How User Accesses It**: Search bar, category tabs, and filter dropdowns on `/opportunities`.
- **Frontend Implementation**: `OpportunitiesPage.jsx` renders filter controls, pagination bar, and `OpportunityCard.jsx` grid.
- **Backend Implementation**: `opportunity_bp.route("", methods=["GET"])` in `backend/app/routes/opportunity.py`.
- **API Endpoints**: `GET /api/opportunities`, `GET /api/opportunities/:id`
- **Database Collections Involved**: `opportunities`
- **AI / External Integrations**: None. Pure MongoDB query filtering.
- **Internal Workflow**:
  1. Extracts query parameters: `search`, `type` (job, internship, hackathon), `location`, `work_mode` (remote, on-site, hybrid), `page`, `limit`.
  2. Builds MongoDB `$and` query filter excluding expired opportunities (`status: {"$ne": "expired"}`).
  3. Applies text regex search across `title`, `company`, `skills`, and `description`.
  4. Executes count query and pagination query with `.skip((page-1)*limit).limit(limit)`.
  5. Formats results and returns paginated list with total pages and count.
- **Validation & Security**: Limit is capped at 100 per page to prevent denial-of-service query exhaustion; regex input is escaped.
- **Error Handling**: Returns empty list with 200 OK if no matches found; 400 Bad Request if invalid page/limit numbers supplied.
- **Implementation Status**: Implemented and tested.
- **Known Limitations**: Full-text search uses MongoDB regex matching rather than an Atlas Search Lucene inverted index.
- **Relevant Source Files**: `backend/app/routes/opportunity.py`, `backend/app/models/opportunity.py`, `frontend/src/pages/OpportunitiesPage.jsx`.

---

## E. Eligibility & Recommendation Engine

### 1. Two-Phase Decoupled Recommendation Engine
- **Purpose**: Generates personalized opportunity rankings for students by strictly decoupling hard academic eligibility rules from preference scoring.
- **Problem It Solves**: Prevents students from being recommended jobs they cannot legally apply for due to graduation batch or branch criteria.
- **How User Accesses It**: Personalized feed on `/dashboard` and "Recommended for You" tab on `/opportunities`.
- **Frontend Implementation**: `AbekusHeroDeck.jsx` on dashboard and `OpportunityCard.jsx` with match percentage badges and explainability tooltips.
- **Backend Implementation**: `RecommendationEngine` in `app/services/recommendation_engine.py` and `EligibilityEngine` in `app/services/eligibility_engine.py`.
- **API Endpoints**: `GET /api/recommendations`, `GET /api/opportunities/recommendations`
- **Database Collections Involved**: `opportunities`, `student_profiles`, `applications`, `companies`
- **AI / External Integrations**: Grounded explainability generator (in-memory rule-based rationale with optional LLM polish).
- **Internal Workflow**:
  1. Fetches student profile and all active, non-expired opportunities.
  2. **Phase 1 — Hard Eligibility**:
     - *Deadline Rule*: Compares deadline string against UTC now.
     - *Graduation Batch*: Compares profile graduation year against opportunity allowed batches.
     - *Degree & Branch*: Checks if student branch is allowed.
     - *Minimum CGPA*: Checks if student CGPA $\ge$ required minimum.
     - Hard rule failure marks opportunity `status: "not_eligible"`.
  3. **Phase 2 — 5-Factor Weighted Scoring** (for eligible roles):
     $$\text{Score} = (0.35 \times S_{\text{skill}}) + (0.25 \times S_{\text{role}}) + (0.15 \times S_{\text{project}}) + (0.15 \times S_{\text{edu}}) + (0.10 \times S_{\text{loc}})$$
  4. Applies $+10$ urgency boost if deadline is within 5 days; $+10$ boost if company is in student watchlist.
  5. Generates grounded rationale string detailing matched skills and academic alignment.
  6. Applies anti-clustering diversity sort (max 2 listings per company per page).
- **Validation & Security**: 0% false eligibility guarantees; applied opportunities are automatically excluded from recommendations.
- **Error Handling**: Cold-start fallback: if student has no skills or projects, recommends entry-level roles ranked by deadline recency.
- **Implementation Status**: Implemented and tested in `test_recommendation_engine.py` and `test_dedup_and_recommendations.py`.
- **Known Limitations**: When job descriptions omit graduation batch or CGPA criteria, the engine flags the rule as `needs_review` rather than assuming automatic eligibility.
- **Relevant Source Files**: `backend/app/services/recommendation_engine.py`, `backend/app/services/eligibility_engine.py`.

---

## F. Skill Gap Analysis

### 1. Evidence-Based Diagnostic Skill Gap & Readiness Engine
- **Purpose**: Evaluates student readiness for target engineering roles, classifying skills into demonstrated, coursework, and listed evidence.
- **Problem It Solves**: Helps students understand the critical difference between having a keyword on a resume and having practical project proof.
- **How User Accesses It**: Navigates to `/skill-gap` in top navigation.
- **Frontend Implementation**: `SkillGapPage.jsx` renders target role selector, readiness progress ring, category bar charts (`SkillRequirementComparisonChart.jsx`), skill radar chart, and learning roadmaps.
- **Backend Implementation**: `SkillGapService` in `backend/app/services/skill_gap_service.py` utilizing `TARGET_ROLE_REQUIREMENTS` from `app/services/skill_requirements.py`.
- **API Endpoints**: `GET /api/skill-gap`, `POST /api/skill-gap/target-role`
- **Database Collections Involved**: `student_profiles`, `learning_progress`
- **AI / External Integrations**: None. Pure deterministic taxonomy matching and scoring.
- **Internal Workflow**:
  1. Student selects target role (e.g., "Backend Engineer", "Frontend Engineer", "DevOps Engineer").
  2. Service retrieves canonical skill matrix across 7 categories: Programming Languages, Databases, Frameworks, CS Fundamentals, Cloud/DevOps, Data/AI, Testing.
  3. Scans student profile:
     - Project tech stack & internship roles $\rightarrow$ `evidenceType: "demonstrated"` (weight 1.0).
     - University coursework subjects $\rightarrow$ `evidenceType: "coursework"` (weight 0.75).
     - Resume keywords / profile tags $\rightarrow$ `evidenceType: "listed"` (weight 0.5).
  4. Calculates readiness percentage:
     $$\text{Readiness \%} = \frac{\sum \text{Verified Skill Weights}}{\sum \text{Required Skill Weights}} \times 100$$
  5. Segregates missing competencies into *Priority Gaps* (core mandatory skills) and *Secondary Gaps* (nice-to-have tools).
  6. Attaches curated learning resources and project ideas from `resource_catalog.py` and `project_catalog.py`.
- **Validation & Security**: Target role validated against supported catalog; evidence provenance strictly documented.
- **Error Handling**: Graceful fallback if target role not specified (defaults to Software Engineer or primary profile goal).
- **Implementation Status**: Implemented and tested in `test_skill_gap.py` and `test_skill_gap_coursework.py`.
- **Known Limitations**: Skill catalog covers 12 predefined target engineering roles; non-software engineering disciplines are out of scope.
- **Relevant Source Files**: `backend/app/services/skill_gap_service.py`, `backend/app/services/skill_requirements.py`, `frontend/src/pages/SkillGapPage.jsx`.

---

## G. Application Tracking

### 1. Drag-and-Drop Kanban Board & Application Lifecycle Pipeline
- **Purpose**: Manages the student's end-to-end application lifecycle across standard hiring stages.
- **Problem It Solves**: Replaces scattered spreadsheets with an interactive visual pipeline with timeline tracking.
- **How User Accesses It**: Navigates to `/applications`.
- **Frontend Implementation**: `ApplicationsPage.jsx` and `DndKanbanBoard.jsx` using `@dnd-kit/core` and `@dnd-kit/sortable` for fluid drag-and-drop transitions between 5 stage columns: `Saved`, `Applied`, `Interviewing`, `Offer`, `Rejected`.
- **Backend Implementation**: `application_bp` in `backend/app/routes/application.py` and `ApplicationModel` in `backend/app/models/application.py`.
- **API Endpoints**: `GET /api/applications`, `POST /api/applications`, `PUT /api/applications/:id`, `PATCH /api/applications/:id/status`, `DELETE /api/applications/:id`
- **Database Collections Involved**: `applications`, `interview_events`
- **AI / External Integrations**: Confetti animation (`canvas-confetti`) triggered on transitions to the `Offer` stage.
- **Internal Workflow**:
  1. Moving a card drops it into a new stage column.
  2. Frontend sends `PATCH /api/applications/:id/status` with `{ status: "Interviewing" }`.
  3. Backend verifies user ownership and validates status transition.
  4. Appends audit event to application's `timeline` array with timestamp and previous stage.
  5. Updates `applied_at` or `interview_scheduled_at` timestamps accordingly.
  6. Returns updated application record.
- **Validation & Security**: Strictly validates status against allowable enum: `{"saved", "applied", "interviewing", "offer", "rejected"}`; isolates applications per authenticated user.
- **Error Handling**: `404 Not Found` if application belongs to another user; `400 Bad Request` if invalid stage name supplied.
- **Implementation Status**: Implemented and tested.
- **Known Limitations**: Moving a card offline does not queue changes in IndexedDB for offline sync.
- **Relevant Source Files**: `frontend/src/components/applications/DndKanbanBoard.jsx`, `backend/app/routes/application.py`, `backend/app/models/application.py`.

---

### 2. Calendar Synchronization & ICS Export
- **Purpose**: Visualizes application deadlines and interview rounds in a calendar format with iCalendar export.
- **Problem It Solves**: Prevents students from missing interview dates and application closing deadlines.
- **How User Accesses It**: "Calendar View" toggle on `/applications` and "Export to Calendar" button.
- **Frontend Implementation**: `ApplicationCalendarView.jsx` rendering monthly grid with deadline/interview chips.
- **Backend Implementation**: `calendar_service.py` generating standard RFC 5545 `.ics` file streams.
- **API Endpoints**: `GET /api/applications/calendar/export`
- **Database Collections Involved**: `applications`, `interview_events`
- **AI / External Integrations**: None. Pure RFC 5545 iCalendar string formatting.
- **Internal Workflow**:
  1. User clicks "Export Calendar (.ics)".
  2. Backend aggregates all applications with active deadlines and upcoming interview events.
  3. Formats `VEVENT` blocks with UID, DTSTART, DTEND, SUMMARY, and DESCRIPTION.
  4. Returns response with MIME type `text/calendar` and header `Content-Disposition: attachment; filename="careerpilot_calendar.ics"`.
- **Validation & Security**: User ownership enforced; events only contain user's personal applications.
- **Error Handling**: Returns empty calendar with 200 OK if no upcoming events exist.
- **Implementation Status**: Implemented and tested.
- **Known Limitations**: One-way file export; does not support Google Calendar OAuth two-way live webhook sync.
- **Relevant Source Files**: `backend/app/services/calendar_service.py`, `frontend/src/components/applications/ApplicationCalendarView.jsx`.

---

## H. Proctored Mock Test Engine

### 1. 200-Question Exam Portal with Anti-Cheating Surveillance
- **Purpose**: Provides timed, proctored computer science examinations tailored to target job applications.
- **Problem It Solves**: Students lack realistic technical screening practice before facing actual online assessment (OA) portals (HackerEarth, Mercer Mettl, HackerRank).
- **How User Accesses It**: Clicking "Take Mock Test" on any active application card or navigating to `/applications/:appId/mock-test`.
- **Frontend Implementation**: `MockTestProctoredPage.jsx` featuring full-screen toggle, timer countdown, tab-switch detection, question palette grid, and review mode.
- **Backend Implementation**: `mock_test_service.py` and `mock_test_question_bank.py` in `backend/app/services/`.
- **API Endpoints**: `POST /api/applications/:appId/mock-test/start`, `POST /api/applications/:appId/mock-test/:testId/submit`
- **Database Collections Involved**: `mock_test_attempts`, `applications`
- **AI / External Integrations**: None. Pure deterministic testing engine backed by 200 curated questions.
- **Internal Workflow**:
  1. Student starts test: selects category or clicks default test.
  2. Service curates 10-25 questions from the 200-question master pool matching application role.
  3. Options are randomized; `correct_answer` is stripped before sending questions to browser.
  4. Full-screen API is requested. If student switches tabs or minimizes window, an event listener increments `tab_switch_count` and triggers an alert warning.
  5. On submit, backend scores choices against master bank, computes category breakdowns, identifies weak topics, and persists attempt in `mock_test_attempts`.
- **Validation & Security**: Answer key is never sent to the client browser during test session; submission requires active attempt ID.
- **Error Handling**: Session state saved in `localStorage` prevents data loss on accidental page reload.
- **Implementation Status**: Implemented and tested in `test_stage5_mock_test_engine.py`.
- **Known Limitations**: Anti-cheating detection is client-side tab-switch/visibility monitoring; webcam proctoring is not implemented.
- **Relevant Source Files**: `frontend/src/pages/MockTestProctoredPage.jsx`, `backend/app/services/mock_test_question_bank.py`, `backend/app/services/mock_test_service.py`.

---

## I. AI Interview Simulator

### 1. Speech-Enabled Proctored AI Interview Simulator
- **Purpose**: Simulates realistic technical, project deep-dive, and behavioral interviews with voice input and automated multi-dimensional scoring.
- **Problem It Solves**: Technical interview practice is either unavailable or expensive; students struggle to articulate complex engineering concepts verbally.
- **How User Accesses It**: Clicking "Launch AI Simulator" on an application card or navigating to `/applications/:appId/interview`.
- **Frontend Implementation**: `InterviewSimulatorProctoredPage.jsx` supporting Web Speech API speech-to-text, text-to-speech audio question reading, timer, and 6-dimension evaluation cards.
- **Backend Implementation**: `InterviewSimulatorService` in `backend/app/services/interview_simulator_service.py`.
- **API Endpoints**:
  - `POST /api/applications/:id/interview/start`
  - `GET /api/applications/:id/interview/:sessId`
  - `POST /api/applications/:id/interview/:sessId/submit`
  - `POST /api/applications/:id/interview/:sessId/pause`
  - `POST /api/applications/:id/interview/:sessId/resume`
  - `POST /api/applications/:id/interview/:sessId/end`
  - `POST /api/applications/:id/interview/:sessId/add-to-roadmap`
- **Database Collections Involved**: `interview_sessions`, `interview_prep_packs`, `applications`, `student_profiles`
- **AI / External Integrations**: Web Speech API (`SpeechRecognition`), Web Speech Synthesis (`speechSynthesis`), Google Gemini 2.5 Flash via `AIService` (with OpenAI and deterministic fallbacks).
- **Internal Workflow**:
  1. Student selects mode: *Technical*, *Coding Discussion*, *Project Deep-Dive*, *STAR Behavioral*, or *Weak-Topic Revision*.
  2. Questions are generated synthesizing the Job Description requirements with candidate's verified projects and skills.
  3. Browser reads question aloud; student dictates answer via microphone.
  4. Submitted answer evaluated by `AIService` across 6 dimensions on a 1-5 scale:
     - Technical Correctness
     - Completeness
     - Problem Solving
     - Clarity & Structure
     - Practical Examples
     - Relevance to Role
  5. Generates overall score band (*Strong*, *Competent*, *Developing*, *Needs Improvement*), what went well, missing concepts, improvement tip, and model reference sample answer.
  6. Student can click "Add to Prep Checklist" to add identified weak points directly to their interview preparation roadmap.
- **Validation & Security**: Delimiter isolation around student transcript prevents prompt injection; mandatory legal disclaimer prominently displayed.
- **Error Handling**: Automatic fallback to deterministic grounded scoring if AI providers fail or timeout.
- **Implementation Status**: Implemented and tested in `test_stage6_interview_simulator.py`.
- **Known Limitations**: Voice recognition relies on browser-level Web Speech API support (optimal in Chrome/Edge/Safari; unavailable in Firefox without flags).
- **Relevant Source Files**: `frontend/src/pages/InterviewSimulatorProctoredPage.jsx`, `backend/app/services/interview_simulator_service.py`.

---

## J. AI Career Copilot

### 1. RAG-Grounded Conversational Advisor with SSE Token Streaming
- **Purpose**: Provides real-time career guidance grounded in the student's actual profile, resume, active applications, and skill gaps.
- **Problem It Solves**: Standalone chatbots offer generic, ungrounded career advice without awareness of student credentials or application status.
- **How User Accesses It**: Floating AI widget on every page or full dedicated workspace at `/ai-advisor`.
- **Frontend Implementation**: `AICareerAdvisorPage.jsx` and `FloatingAICareerAdvisor.jsx` featuring `LivingAIOrb.jsx`, chip prompts, copy-to-clipboard, conversation sidebar, and `useStream.js` hook.
- **Backend Implementation**: `copilot_bp` in `backend/app/routes/copilot.py` and `CareerCopilotService` in `backend/app/services/copilot_service.py`.
- **API Endpoints**:
  - `POST /api/copilot/chat` (Standard JSON response)
  - `POST /api/copilot/stream` (Real Server-Sent Events stream)
  - `GET /api/copilot/conversations`
  - `POST /api/copilot/conversations`
  - `GET /api/copilot/conversations/:id`
  - `DELETE /api/copilot/conversations/:id`
  - `DELETE /api/copilot/conversations`
- **Database Collections Involved**: `copilot_conversations`, `student_profiles`, `applications`, `opportunities`
- **AI / External Integrations**: Google Gemini 2.5 Flash streaming API, OpenAI GPT-4o-mini streaming API.
- **Internal Workflow**:
  1. Student sends message in chat.
  2. `CareerContextRetriever` queries MongoDB for verified student profile, projects, applications, and skill gaps.
  3. Formulates grounded prompt with system injection safeguards and unprintable character stripping.
  4. Initiates SSE stream on `/api/copilot/stream`.
  5. Emits `type: "start"`, then `type: "sources"` (attributing specific projects or opportunities referenced).
  6. Emits incremental `type: "token"` events as LLM generates text.
  7. Client `useStream` hook appends tokens in real time.
  8. Emits `type: "done"` and persists full conversation history in `copilot_conversations`.
- **Validation & Security**: Delimiter isolation (`<<<UNTRUSTED_STUDENT_CONTEXT>>>`), strict 14,000-character prompt ceiling, user ownership verified on conversation retrieval.
- **Error Handling**: Emits recoverable error events if streaming encounters transient glitches; falls back to deterministic grounded guidance if APIs fail.
- **Implementation Status**: Implemented and tested in `test_copilot_rag.py` and `test_copilot_streaming.py`.
- **Known Limitations**: Conversations do not retain uploaded binary document attachments directly within the chat message stream.
- **Relevant Source Files**: `backend/app/routes/copilot.py`, `backend/app/services/copilot_service.py`, `frontend/src/hooks/useStream.js`, `frontend/src/pages/AICareerAdvisorPage.jsx`.

---

## K. Push Notifications & Digest Deliveries

### 1. Real-Time Push Notifications & Scheduled Email Digests
- **Purpose**: Dispatches real-time alerts for application deadlines, scheduled interviews, and opportunity digests.
- **Problem It Solves**: Students miss critical deadlines and interview rounds due to lack of automated alerts.
- **How User Accesses It**: Topbar notification bell dropdown (`NotificationDropdown.jsx`) and dedicated `/notifications` page.
- **Frontend Implementation**: `useNotifications.js` hook listening on Socket.IO client events: `notification:new`, `notification:read`, `notification:unread_count`.
- **Backend Implementation**: `NotificationService` in `app/services/notification_service.py`, `app/socket.py`, and scheduled jobs in `app/services/scheduler.py`.
- **API Endpoints**:
  - `GET /api/notifications`
  - `PATCH /api/notifications/:id/read`
  - `PATCH /api/notifications/read-all`
  - `DELETE /api/notifications/:id`
  - `GET /api/notifications/preferences`
  - `PUT /api/notifications/preferences`
- **Database Collections Involved**: `notifications`, `notification_preferences`, `digest_deliveries`
- **AI / External Integrations**: Flask-SocketIO (WebSocket push), SMTP (optional email dispatch).
- **Internal Workflow**:
  1. Background scheduler or event trigger calls `NotificationService.create_notification()`.
  2. Inserts notification document in `notifications` collection with `read: false`.
  3. Looks up recipient user in active Socket.IO connection registry.
  4. Emits `notification:new` and updated unread count to private room `user_{user_id}`.
  5. Connected client updates badge count and displays visual toast instantly.
- **Validation & Security**: Socket connection requires valid JWT during handshake; students can only join their own `user_{user_id}` room; broadcast room restricted to admin announcements.
- **Error Handling**: If Socket.IO emit fails, notification remains safely stored in database for pull retrieval.
- **Implementation Status**: Implemented and tested in `test_socketio_notifications.py`.
- **Known Limitations**: Production multi-worker deployments require Redis message queue (`REDIS_URL`) to broadcast events across multiple worker processes.
- **Relevant Source Files**: `backend/app/socket.py`, `backend/app/services/notification_service.py`, `frontend/src/hooks/useNotifications.js`.

---

## L. Administration & System Telemetry

### 1. Platform Administration & KPI Analytics Portal
- **Purpose**: Equips platform operators with system monitoring, user moderation, ingestion source triggers, and security audit logs.
- **Problem It Solves**: Allows administrators to maintain data freshness, review student feedback, and audit security events without direct database manipulation.
- **How User Accesses It**: `/admin` portal (requires `role: "admin"`).
- **Frontend Implementation**: `AdminLayout.jsx` with dedicated sidebar navigating to Overview, Users, Opportunities, Sources, Analytics, Feedback, Audit Logs, and Settings.
- **Backend Implementation**: `admin_bp` in `backend/app/routes/admin.py` and `AdminService` in `backend/app/services/admin_service.py`.
- **API Endpoints**:
  - `GET /api/admin/overview`
  - `GET /api/admin/charts`
  - `GET /api/admin/users`
  - `PATCH /api/admin/users/:id/role`
  - `PATCH /api/admin/users/:id/status`
  - `GET /api/admin/sources`
  - `POST /api/admin/sources/sync`
  - `GET /api/admin/audit-logs`
  - `GET /api/admin/feedback`
- **Database Collections Involved**: `users`, `opportunities`, `source_runs`, `audit_logs`, `user_feedback`
- **AI / External Integrations**: None. Pure aggregation pipelines.
- **Internal Workflow**:
  1. Admin logs in; `@admin_required` guards all API routes.
  2. Overview dashboard runs MongoDB aggregations computing active users, total opportunities, ingestion health, and application conversion funnels.
  3. Source management allows triggering manual ingestion sync runs on demand.
  4. Audit log records administrative actions (role changes, suspensions, deletions).
- **Validation & Security**: All administrative routes enforce database-backed admin verification; client IP and User Agent logged in `audit_logs`.
- **Error Handling**: Aggregation failures caught and logged with graceful empty fallbacks.
- **Implementation Status**: Implemented and tested in `test_admin_security.py`.
- **Known Limitations**: Export of audit logs to external SIEM tools (e.g. Datadog, Splunk) is not pre-configured.
- **Relevant Source Files**: `backend/app/routes/admin.py`, `backend/app/services/admin_service.py`, `frontend/src/pages/admin/`.

---

## M. Account & Data Management

### 1. Cascading Account Deletion & Permanent Privacy Purge
- **Purpose**: Provides students with complete control over their personal data, executing permanent, staged deletion across all database collections and filesystem storage.
- **Problem It Solves**: Guarantees compliance with modern privacy standards (GDPR, India DPDP Act 2023) by ensuring zero orphaned student data remains after account deletion.
- **How User Accesses It**: Danger Zone section on `/settings`.
- **Frontend Implementation**: Confirmation modal in `frontend/src/pages/SettingsPage.jsx` requiring student's current password and typing `"DELETE"` in uppercase.
- **Backend Implementation**: `AccountDeletionService.delete_account()` in `backend/app/services/account_deletion_service.py`.
- **API Endpoints**: `DELETE /api/profile/account`
- **Database Collections Involved**: All 14 personal collections: `student_profiles`, `applications`, `notifications`, `notification_preferences`, `interview_events`, `interview_prep_packs`, `mock_test_attempts`, `interview_sessions`, `generated_resumes`, `learning_progress`, `user_feedback`, `digest_deliveries`, `copilot_conversations`, `users`.
- **AI / External Integrations**: None.
- **Internal Workflow**:
  1. Validates current password and `"DELETE"` confirmation string.
  2. Sets user status to `"suspended"` and disconnects active Socket.IO connections.
  3. Deletes physical resume file from disk (`os.remove()`). If file deletion fails, records path in `failed_file_cleanups` for administrative retry.
  4. Executes `delete_many` across all 14 personal collections.
  5. Deletes the root user record from `users`.
  6. Creates an anonymized audit log event (`user_account_deleted`) containing zero PII (no email, no name, only role and deleted record counts).
- **Validation & Security**: Password verification prevents unauthorized deletion; active socket termination prevents concurrent write race conditions.
- **Error Handling**: Staged execution; if an error occurs, user remains suspended while rollback or error report is logged.
- **Implementation Status**: Implemented and tested in `test_account_deletion.py`.
- **Known Limitations**: Backup snapshots of MongoDB (if taken out-of-band) retain deleted documents until backup expiration cycles complete.
- **Relevant Source Files**: `backend/app/services/account_deletion_service.py`, `backend/app/routes/profile.py`, `frontend/src/pages/SettingsPage.jsx`.

