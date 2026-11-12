# CareerPilot AI — REST API Specification & Route Reference

## 1. Overview & Protocol Standards
- **Base URL**: `/api` (e.g., `http://127.0.0.1:5000/api` or configured via `VITE_API_BASE_URL`)
- **Authentication**: Stateless Bearer JWT via HTTP Header: `Authorization: Bearer <token>`
- **Content Types**: 
  - Standard Requests/Responses: `application/json; charset=utf-8`
  - Resume Uploads: `multipart/form-data`
  - Real-Time Live Feeds & Copilot Streams: `text/event-stream` (Server-Sent Events)
  - Calendar Export: `text/calendar; charset=utf-8`
- **Standard Envelope Format**:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```
- **Standard Error Envelope**:
```json
{
  "success": false,
  "message": "Human-readable explanation of error",
  "error": "STANDARDIZED_ERROR_CODE"
}
```

---

## 2. API Status Legend
- **[Implemented & Tested]**: Fully implemented, active route, covered by automated tests.
- **[Implemented & Live Verified]**: Verified against live external APIs or live local database.
- **[Administrative / Protected]**: Requires authenticated user with `role: "admin"`.
- **[Streaming Endpoint]**: Uses HTTP Chunked Transfer Encoding / Server-Sent Events (SSE).

---

## 3. Complete API Inventory by Subsystem

### 3.1 Authentication & User Session (`/api/auth`)

#### `POST /api/auth/register` [Implemented & Tested]
- **Purpose**: Registers a new student account and creates default profile.
- **Auth Required**: None (Public).
- **Request Body**:
```json
{
  "name": "Arjun Sharma",
  "email": "arjun.sharma@example.edu.in",
  "password": "SecurePassword123!"
}
```
- **Validation**: Email format regex, password length $\ge 8$, required fields present. Role automatically forced to `"student"`.
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "670f1a2b3c4d5e6f7a8b9c0d",
      "name": "Arjun Sharma",
      "email": "arjun.sharma@example.edu.in",
      "role": "student"
    }
  }
}
```
- **Error Codes**: `400 BAD_REQUEST`, `409 CONFLICT` (Email already registered).

---

#### `POST /api/auth/login` [Implemented & Tested]
- **Purpose**: Authenticates credentials and returns a 24-hour signed JWT.
- **Auth Required**: None (Public).
- **Request Body**:
```json
{
  "email": "arjun.sharma@example.edu.in",
  "password": "SecurePassword123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "670f1a2b3c4d5e6f7a8b9c0d",
      "name": "Arjun Sharma",
      "email": "arjun.sharma@example.edu.in",
      "role": "student"
    }
  }
}
```
- **Error Codes**: `401 UNAUTHORIZED` (Invalid credentials), `403 ACCOUNT_SUSPENDED`.

---

#### `GET /api/auth/me` [Implemented & Tested]
- **Purpose**: Returns the authenticated user's current session state.
- **Auth Required**: Yes (`Bearer <token>`).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "670f1a2b3c4d5e6f7a8b9c0d",
    "name": "Arjun Sharma",
    "email": "arjun.sharma@example.edu.in",
    "role": "student",
    "status": "active",
    "created_at": "2026-10-15T08:30:00Z"
  }
}
```
- **Error Codes**: `401 UNAUTHORIZED`, `404 USER_NOT_FOUND`.

---

#### `POST /api/auth/change-password` [Implemented & Tested]
- **Purpose**: Updates student account password verifying existing password.
- **Auth Required**: Yes.
- **Request Body**:
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewSecurePassword456!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```
- **Error Codes**: `400 BAD_REQUEST`, `401 UNAUTHORIZED` (Incorrect current password).

---

### 3.2 Student Profile Management (`/api/profile`)

#### `GET /api/profile` [Implemented & Tested]
- **Purpose**: Retrieves full student profile, academic records, and completion percentage.
- **Auth Required**: Yes.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "_id": "670f1a2b3c4d5e6f7a8b9c0e",
    "user_id": "670f1a2b3c4d5e6f7a8b9c0d",
    "personal_info": {
      "full_name": "Arjun Sharma",
      "phone": "+91 98765 43210",
      "city": "Bengaluru",
      "github_url": "https://github.com/arjun-dev",
      "linkedin_url": "https://linkedin.com/in/arjun-dev"
    },
    "education": {
      "degree": "B.Tech",
      "branch": "Computer Science and Engineering",
      "institution": "National Institute of Technology Karnataka",
      "graduation_year": 2026,
      "cgpa": 8.75,
      "coursework": ["Data Structures", "Database Management", "Operating Systems", "Computer Networks"]
    },
    "skills": ["Python", "JavaScript", "React", "Node.js", "MongoDB", "Docker"],
    "projects": [
      {
        "title": "CloudTask Microservices Platform",
        "description": "Distributed task queue processing 10k jobs/min with Redis.",
        "technologies": ["Python", "Flask", "Redis", "Docker"],
        "github_url": "https://github.com/arjun-dev/cloudtask"
      }
    ],
    "completion_percentage": 90,
    "field_sources": {
      "education.cgpa": "manual",
      "skills": "resume"
    }
  }
}
```

---

#### `PUT /api/profile` [Implemented & Tested]
- **Purpose**: Replaces or updates the student's personal, education, and project sections.
- **Auth Required**: Yes.
- **Request Body**: JSON object matching profile schema.
- **Success Response (200 OK)**: Returns updated profile object and completion score.

---

#### `DELETE /api/profile/account` [Implemented & Tested]
- **Purpose**: Permanently deletes student account, uploaded resume, and all personal records.
- **Auth Required**: Yes.
- **Request Body**:
```json
{
  "password": "SecurePassword123!",
  "confirmation": "DELETE"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Your account and all associated personal data have been permanently deleted."
}
```
- **Error Codes**: `400 BAD_REQUEST`, `401 UNAUTHORIZED` (Incorrect password), `500 INTERNAL_ERROR`.

---

### 3.3 Resume Management (`/api/resume`)

#### `POST /api/resume/upload` [Implemented & Tested]
- **Purpose**: Uploads and saves a PDF or DOCX resume document.
- **Auth Required**: Yes.
- **Request Format**: `multipart/form-data`, Key: `"resume"`.
- **Validation**: File extension in `{"pdf", "docx"}`, File size $\le$ 10 MB.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": {
    "fileName": "Arjun_Sharma_Resume.pdf",
    "fileSize": 145820,
    "uploadedAt": "2026-10-16T10:15:00Z",
    "analysisStatus": "pending"
  }
}
```
- **Error Codes**: `400 INVALID_FILE_TYPE`, `400 FILE_TOO_LARGE`.

---

#### `POST /api/resume/analyze` [Implemented & Tested]
- **Purpose**: Extracts text and parses structured skills, education, and projects via Gemini AI.
- **Auth Required**: Yes.
- **Query Parameters**: `save=false` (Enables review mode without modifying profile immediately).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Resume analyzed successfully. Review and confirm changes before saving.",
  "data": {
    "review_mode": true,
    "extracted_data": {
      "name": "Arjun Sharma",
      "email": "arjun.sharma@example.edu.in",
      "skills": ["Python", "Flask", "React", "PostgreSQL", "Docker", "Git"],
      "education": {
        "degree": "B.Tech Computer Science",
        "institution": "NIT Karnataka",
        "graduation_year": 2026,
        "cgpa": 8.75
      },
      "projects": [
        {
          "title": "CloudTask Microservices Platform",
          "technologies": ["Python", "Flask", "Redis"],
          "description": "Built distributed background queue."
        }
      ]
    },
    "clean_text_preview": "Arjun Sharma | Software Engineer..."
  }
}
```
- **Error Codes**: `404 RESUME_NOT_FOUND`, `422 EXTRACTION_ERROR`, `500 ANALYSIS_FAILED`.

---

#### `POST /api/resume/confirm-extraction` [Implemented & Tested]
- **Purpose**: Applies student-approved extracted fields to their profile with provenance preservation.
- **Auth Required**: Yes.
- **Request Body**:
```json
{
  "confirmed_data": {
    "skills": ["Python", "Flask", "React", "Docker"],
    "projects": [...]
  },
  "selected_fields": ["skills", "projects"]
}
```
- **Success Response (200 OK)**: Returns updated profile with merged attributes.

---

### 3.4 Opportunity Discovery & Search (`/api/opportunities`)

#### `GET /api/opportunities` [Implemented & Tested]
- **Purpose**: Searches and filters active opportunities from real MongoDB collections.
- **Auth Required**: Yes.
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
  - `search`: Keyword string
  - `type`: `job`, `internship`, `hackathon`, `contest`, `scholarship`
  - `work_mode`: `remote`, `on-site`, `hybrid`
  - `location`: City or region filter
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "_id": "670f2b3c4d5e6f7a8b9c001",
        "title": "Software Development Engineer - Intern",
        "company": "Amazon India",
        "type": "internship",
        "location": {
          "city": "Bengaluru",
          "state": "Karnataka",
          "country": "India",
          "is_remote": false
        },
        "skills": ["Java", "Data Structures", "Algorithms", "AWS"],
        "eligibility": {
          "graduation_years": [2026, 2027],
          "allowed_branches": ["Computer Science", "Information Technology", "Electronics"],
          "min_cgpa": 7.0
        },
        "dates": {
          "deadline": "2026-11-20T23:59:59Z",
          "posted_at": "2026-10-14T09:00:00Z"
        },
        "application_url": "https://amazon.jobs/en/jobs/2589012"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_count": 142,
      "total_pages": 8
    }
  }
}
```

---

#### `GET /api/opportunities/:id` [Implemented & Tested]
- **Purpose**: Retrieves comprehensive details for a specific opportunity document.
- **Auth Required**: Yes.
- **Success Response (200 OK)**: Returns full opportunity object.
- **Error Codes**: `404 NOT_FOUND`.

---

### 3.5 Recommendations & Eligibility Engine (`/api/recommendations`)

#### `GET /api/recommendations` [Implemented & Tested]
- **Purpose**: Generates personalized opportunity rankings evaluated by deterministic hard eligibility rules and 5-factor scoring.
- **Auth Required**: Yes.
- **Query Parameters**: `limit` (default: 10), `category` (optional)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "opportunity": {
          "_id": "670f2b3c4d5e6f7a8b9c001",
          "title": "Software Development Engineer - Intern",
          "company": "Amazon India"
        },
        "match_score": 88,
        "eligibility": {
          "status": "eligible",
          "is_eligible": true,
          "checks": [
            { "requirement": "Application Deadline", "status": "passed" },
            { "requirement": "Graduation Batch (2026)", "status": "passed" },
            { "requirement": "Degree Branch", "status": "passed" },
            { "requirement": "Minimum CGPA (>= 7.0)", "status": "passed" }
          ]
        },
        "score_breakdown": {
          "skill_relevance": 32,
          "role_preference": 25,
          "project_experience": 13,
          "education_fit": 15,
          "location_workmode": 8
        },
        "explanation": "High match (88%): Strong alignment with your verified skills in Data Structures and Algorithms; batch 2026 meets graduation requirement."
      }
    ]
  }
}
```

---

### 3.6 Skill Gap Diagnostic Engine (`/api/skill-gap`)

#### `GET /api/skill-gap` [Implemented & Tested]
- **Purpose**: Evaluates candidate readiness against target role requirements with evidence qualification.
- **Auth Required**: Yes.
- **Query Parameters**: `target_role` (e.g. `Backend Engineer`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "target_role": "Backend Engineer",
    "readiness_percentage": 76,
    "score_band": "Job Ready",
    "verified_skills": [
      {
        "skill": "Python",
        "category": "Programming Languages",
        "evidence_type": "demonstrated",
        "source": "Project 'CloudTask Microservices Platform'"
      },
      {
        "skill": "Database Management Systems",
        "category": "Databases",
        "evidence_type": "coursework",
        "source": "University Syllabus"
      }
    ],
    "priority_gaps": [
      {
        "skill": "Redis",
        "category": "Databases",
        "importance": "Mandatory",
        "learning_resources": [
          { "title": "Redis Crash Course", "url": "https://redis.io/learn" }
        ],
        "project_suggestion": "Implement a cache-aside layer for a high-volume REST API."
      }
    ],
    "secondary_gaps": [
      { "skill": "Kubernetes", "category": "Cloud & DevOps", "importance": "Nice-to-Have" }
    ],
    "category_breakdown": {
      "Programming Languages": { "covered": 2, "required": 2, "percentage": 100 },
      "Databases": { "covered": 1, "required": 2, "percentage": 50 }
    }
  }
}
```

---

### 3.7 Application Tracking & Kanban (`/api/applications`)

#### `GET /api/applications` [Implemented & Tested]
- **Purpose**: Retrieves all job/internship applications submitted or saved by the student.
- **Auth Required**: Yes.
- **Success Response (200 OK)**: Array of application records grouped by stage (`Saved`, `Applied`, `Interviewing`, `Offer`, `Rejected`).

---

#### `POST /api/applications` [Implemented & Tested]
- **Purpose**: Creates an application entry linked to an opportunity or entered manually.
- **Auth Required**: Yes.
- **Request Body**:
```json
{
  "opportunity_id": "670f2b3c4d5e6f7a8b9c001",
  "company": "Amazon India",
  "role": "Software Development Engineer - Intern",
  "status": "applied",
  "notes": "Applied via referral link on careers portal."
}
```
- **Success Response (201 Created)**: Returns created application document.

---

#### `PATCH /api/applications/:id/status` [Implemented & Tested]
- **Purpose**: Updates application stage (Kanban card move) and logs timeline audit event.
- **Auth Required**: Yes.
- **Request Body**: `{ "status": "interviewing" }`
- **Success Response (200 OK)**: Returns updated application with updated `timeline` array.

---

#### `GET /api/applications/calendar/export` [Implemented & Tested]
- **Purpose**: Exports upcoming deadlines and interview events as a standard RFC 5545 `.ics` file.
- **Auth Required**: Yes.
- **Response Format**: `text/calendar; charset=utf-8` with `Content-Disposition: attachment; filename="careerpilot_calendar.ics"`.

---

### 3.8 Proctored Mock Test Arena (`/api/applications/:appId/mock-test`)

#### `POST /api/applications/:appId/mock-test/start` [Implemented & Tested]
- **Purpose**: Starts a timed, proctored computer science exam session from the 200-question pool.
- **Auth Required**: Yes.
- **Request Body**:
```json
{
  "question_count": 15,
  "categories": ["Technical MCQs", "Data Structures & Algorithms", "SQL & Databases"]
}
```
- **Success Response (200 OK)**: Returns session metadata and array of questions with randomized choices (answers withheld).

---

#### `POST /api/applications/:appId/mock-test/:testId/submit` [Implemented & Tested]
- **Purpose**: Submits test choices, tab-switch counts, and computes performance diagnostic.
- **Auth Required**: Yes.
- **Request Body**:
```json
{
  "answers": {
    "tech_1": "Event-Driven Architecture using Message Queues (e.g. RabbitMQ, Kafka)",
    "tech_2": "Either Consistency (C) or Availability (A)"
  },
  "tab_switch_count": 0,
  "time_taken_seconds": 720
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "score_percentage": 93.3,
    "total_questions": 15,
    "correct_count": 14,
    "tab_switch_count": 0,
    "weak_topics": ["Distributed Locking"],
    "review": [...]
  }
}
```

---

### 3.9 AI Interview Simulator (`/api/applications/:id/interview`)

#### `POST /api/applications/:id/interview/start` [Implemented & Tested]
- **Purpose**: Initiates or resumes an interactive voice/text interview simulation session.
- **Auth Required**: Yes.
- **Request Body**:
```json
{
  "mode": "project_deep_dive",
  "difficulty": "medium",
  "question_count": 5
}
```
- **Success Response (200 OK)**: Returns session document with first grounded question.

---

#### `POST /api/applications/:id/interview/:sessId/submit` [Implemented & Tested]
- **Purpose**: Submits student verbal or written answer for multi-dimensional AI evaluation.
- **Auth Required**: Yes.
- **Request Body**:
```json
{
  "question_id": "sim_syn_1",
  "answer_text": "To handle 50,000 requests per minute, I would configure a connection pool with HikariCP, use a Redis cache-aside tier, and configure a Resilience4j circuit breaker with a 50% failure rate threshold."
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "score_percentage": 85,
    "score_band": "Strong",
    "dimensions": {
      "technical_correctness": { "score": 5, "feedback": "Accurate connection pool and circuit breaker sizing." },
      "completeness": { "score": 4, "feedback": "Addressed both caching and resiliency." },
      "clarity": { "score": 4, "feedback": "Well-structured response." }
    },
    "what_went_well": ["Mentioned specific production tools (HikariCP, Redis)."],
    "missing_concepts": ["Did not mention database read-replicas."],
    "suggested_improvement": "Discuss how cache invalidation behaves during network partitions.",
    "sample_answer": "Model answer string...",
    "disclaimer": "This AI interview simulator is an interactive practice environment..."
  }
}
```

---

### 3.10 AI Career Copilot (`/api/copilot`)

#### `POST /api/copilot/stream` [Streaming Endpoint — Implemented & Tested]
- **Purpose**: Generates streaming RAG conversational advice via Server-Sent Events.
- **Auth Required**: Yes.
- **Request Body**:
```json
{
  "message": "What skills should I learn before applying for backend roles?",
  "conversation_id": "670f3c4d5e6f7a8b9c002"
}
```
- **Stream Output (`text/event-stream`)**:
```
data: {"type": "start", "conversation_id": "670f3c4d5e6f7a8b9c002"}

data: {"type": "sources", "sources": [{"title": "Verified Profile", "type": "profile"}]}

data: {"type": "token", "token": "Based "}

data: {"type": "token", "token": "on your "}

data: {"type": "token", "token": "projects, "}

data: {"type": "done", "full_text": "Based on your projects..."}
```

---

### 3.11 Real-Time Opportunity Telemetry Stream (`/api/stream`)

#### `GET /api/stream/opportunities` [Streaming Endpoint — Implemented & Tested]
- **Purpose**: Pushes live opportunity updates, ingestion status, and deadline alerts via SSE.
- **Auth Required**: None (Open SSE EventStream).
- **Stream Output (`text/event-stream`)**:
```
event: connected
data: {"type": "connected", "message": "Connected to CareerPilot live telemetry stream"}

event: update
data: {"type": "new_opportunities", "count": 3, "timestamp": "2026-10-16T12:00:00Z"}

: ping
data: {"type": "ping", "timestamp": "2026-10-16T12:00:15Z"}
```

---

### 3.12 Notifications & Alerts (`/api/notifications`)

#### `GET /api/notifications` [Implemented & Tested]
- **Purpose**: Retrieves student notifications with pagination and unread counts.
- **Auth Required**: Yes.
- **Success Response (200 OK)**: Array of notification objects and `unread_count`.

---

#### `PATCH /api/notifications/read-all` [Implemented & Tested]
- **Purpose**: Marks all unread notifications as read and emits WebSocket count update.
- **Auth Required**: Yes.
- **Success Response (200 OK)**: `{ "success": true, "message": "All notifications marked as read" }`.

---

### 3.13 Administration (`/api/admin`)

#### `GET /api/admin/overview` [Administrative — Implemented & Tested]
- **Purpose**: Returns real-time KPI metrics and database counts.
- **Auth Required**: Yes (`role: "admin"`).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total_students": 542,
    "active_opportunities": 184,
    "total_applications": 1280,
    "interviews_scheduled": 86,
    "system_health": "healthy"
  }
}
```

---

#### `POST /api/admin/sources/sync` [Administrative — Implemented & Tested]
- **Purpose**: Triggers on-demand ingestion run across all live external sources.
- **Auth Required**: Yes (`role: "admin"`).
- **Success Response (200 OK)**: Returns ingestion execution metrics (fetched, accepted, duplicates, expired).

