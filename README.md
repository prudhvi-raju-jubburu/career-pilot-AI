# CareerPilot AI — Intelligent Career Opportunity Discovery & Application Management Platform

CareerPilot AI is a personal AI career assistant designed for students to automatically discover opportunities (internships, full-time jobs, scholarships, hackathons, coding contests, workshops, conferences), evaluate deterministic eligibility, identify skill gaps, provide AI matching recommendations, and track applications end-to-end.

---

## 🏗️ Project Architecture (Phase 1)

```
careerpilot-ai/
│
├── frontend/                     # React.js SPA (Vite + React Router + Axios)
│   ├── src/
│   │   ├── components/           # Reusable UI components (Navbar, Footer, etc.)
│   │   ├── pages/                # Page views (LandingPage, Login, Register, Dashboard)
│   │   ├── services/             # Axios API service & backend endpoints
│   │   ├── hooks/                # Custom React hooks
│   │   ├── context/              # React Context providers (AuthContext in Phase 2)
│   │   ├── utils/                # Frontend helper utilities
│   │   ├── App.jsx               # Route definitions
│   │   ├── main.jsx              # Application root
│   │   └── index.css             # SaaS design system & theme variables
│   ├── index.html
│   ├── vite.config.js            # Vite configuration with API proxy
│   └── package.json
│
├── backend/                      # Python Flask REST API
│   ├── app/
│   │   ├── routes/               # API endpoints (health, and future auth, profile, etc.)
│   │   ├── models/               # PyMongo database models
│   │   ├── services/             # Business logic layer
│   │   ├── ai/                   # Gemini & LLM matching modules
│   │   ├── scrapers/             # Opportunity discovery scrapers & feeds
│   │   ├── utils/                # Backend utilities & helpers
│   │   ├── config/               # App config & PyMongo client manager
│   │   └── __init__.py           # Application factory (CORS, DB, error handling)
│   ├── uploads/                  # Uploaded student resumes (git-ignored)
│   ├── tests/                    # Unit & integration tests
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Local environment configuration
│   └── run.py                    # Server startup script (Port 5000)
│
├── README.md                     # Project documentation & setup instructions
└── .gitignore                    # Git ignore file
```

---

## ⚙️ Prerequisites

- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18+ (tested on Node v22)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI

---

## 🔐 Environment Variables

The backend loads configuration from `backend/.env`. A template is provided in `backend/.env.example`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `FLASK_ENV` | Application environment (`development` / `production`) | `development` |
| `FLASK_PORT` | Port for the Flask backend | `5000` |
| `SECRET_KEY` | Flask secret key for sessions/signing | `careerpilot_development_secret_key` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/careerpilot_ai` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `supersecret_jwt_dev_key_change_in_production` |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | *(Leave empty for Phase 1)* |
| `FRONTEND_URL` | Allowed frontend URL for CORS | `http://localhost:5173` |

---

## 🚀 Getting Started

### 1. Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. *(Optional but recommended)* Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Verify or create your `.env` file:
   ```bash
   cp .env.example .env
   ```

5. Run the Flask backend server:
   ```bash
   python run.py
   ```
   Backend will start on: **`http://localhost:5000`**

---

### 2. Frontend Setup

1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will start on: **`http://localhost:5173`**

---

## 🩺 Testing the Health Endpoint

### Direct HTTP Request
Run via PowerShell or Terminal:
```bash
curl http://localhost:5000/api/health
```

Or using PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health -Method Get | ConvertTo-Json
```

### Expected Response:
```json
{
  "success": true,
  "message": "CareerPilot AI backend is running",
  "data": {
    "database": {
      "connected": true,
      "status": "Connected"
    },
    "service": "careerpilot-ai-backend",
    "status": "healthy",
    "timestamp": "2026-09-22T16:25:32.594680+00:00"
  }
}
```

The frontend landing page at `http://localhost:5173` also performs a live ping to `/api/health` and shows a real-time status badge and diagnostic panel.

---

## 📋 Development Roadmap

- [x] **Phase 1: Project Setup** — Modular structure, Flask API, React Vite frontend, PyMongo client, CORS, and `/api/health`.
- [ ] **Phase 2: Authentication** — Student registration, JWT authentication, protected routes.
- [ ] **Phase 3: Student Profile** — Skills, academic details, preferences.
- [ ] **Phase 4: Resume Upload & AI Analyzer** — PDF text extraction & structured indexing.
- [ ] **Phase 5: Opportunity Model** — MongoDB opportunity schema & indexing.
- [ ] **Phase 6: Opportunity Discovery** — Modular opportunity fetchers & normalizers.
- [ ] **Phase 7: Deterministic Eligibility Engine** — CGPA, year, branch, and skill evaluation.
- [ ] **Phase 8: AI Opportunity Matching** — Match score calculation and semantic fit.
- [ ] **Phase 9: Student Dashboard** — Opportunity discovery UI with filters.
- [ ] **Phase 10: Application Tracker** — Saved & applied stages tracking pipeline.
- [ ] **Phase 11: AI Career Advisor** — Context-aware Gemini conversational assistant.
- [ ] **Phase 12: Skill Gap Analysis** — Targeted learning paths for target roles.
- [ ] **Phase 13 & 14: Notifications & AI Digest** — APScheduler alerts & daily opportunity digests.
