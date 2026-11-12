# CareerPilot AI — Developer Onboarding & Local Environment Guide

Welcome to the **CareerPilot AI** engineering team! This guide walks you through setting up, configuring, running, and debugging CareerPilot AI on your local machine.

---

## 1. Repository Directory Structure

```
careerpilot_ai/
├── .env.example                  # Root template for environment configuration
├── .gitignore                    # Git exclusions (node_modules, .env, venv, uploads)
├── README.md                     # High-level architecture and platform guide
├── pyrightconfig.json            # Python static analysis configuration
├── backend/                      # Flask 3.0 REST API & Socket.IO server
│   ├── run.py                    # Application entry point (socketio.run)
│   ├── requirements.txt          # Python dependency specifications
│   ├── .env.example              # Backend-specific environment template
│   ├── uploads/                  # User resume files storage root (resumes/{user_id}/)
│   ├── app/                      # Main application package
│   │   ├── __init__.py           # Application factory (create_app), blueprints, CORS
│   │   ├── socket.py             # Flask-SocketIO initialization & event handlers
│   │   ├── ai/                   # AI services (Gemini, OpenAI, Resume Analyzer)
│   │   ├── config/               # DB connection, weights, company registry
│   │   ├── models/               # 20 PyMongo document models
│   │   ├── routes/               # 16 Flask REST blueprints
│   │   ├── scrapers/             # External ingestion connectors (Unstop, Devfolio, etc.)
│   │   ├── services/             # Core business logic (Recommendation, Copilot, etc.)
│   │   └── utils/                # Auth, normalizers, experience calculators
│   └── tests/                    # Pytest integration & unit test suite (30+ test files)
├── frontend/                     # React 18 Single Page Application (SPA)
│   ├── package.json              # Frontend npm dependencies & scripts
│   ├── vite.config.js            # Vite build configuration & dev proxy
│   ├── index.html                # HTML entry document
│   └── src/
│       ├── main.jsx              # React DOM root render
│       ├── App.jsx               # Top-level router & route guards
│       ├── index.css             # Global design tokens, typography, CSS variables
│       ├── components/           # Reusable UI modules & feature widgets
│       ├── context/              # AuthContext & ToastContext
│       ├── hooks/                # Custom React hooks (useAuth, useStream, etc.)
│       ├── pages/                # Top-level view pages (Dashboard, Opportunities, etc.)
│       ├── services/             # Axios REST clients & Socket.IO client
│       └── utils/                # Motion presets, formatters, markdown renderers
├── docs/                         # In-depth architectural & audit documentation
│   ├── sources.md                # Ingestion source documentation & rate limits
│   └── project-audit/            # Comprehensive 10-document system audit
└── scripts/                      # Operational utilities
    ├── check-no-mocks.js         # Production zero-mock acceptance verification
    └── purge_users.py            # Environment reset & test user cleanup tool
```

---

## 2. Prerequisites & System Requirements

Before beginning local setup, ensure you have the following installed on your operating system:
1. **Python**: Version **3.12** or higher (`python --version`).
2. **Node.js**: Version **18.x** or **20.x** LTS (`node --version`).
3. **npm**: Version **9.x** or **10.x** (`npm --version`).
4. **MongoDB Community Server**: Version **7.0** or higher (running locally on port 27017 or a free cloud MongoDB Atlas cluster).
5. **Git**: Version **2.30+**.

---

## 3. Step-by-Step Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/careerpilot_ai.git
cd careerpilot_ai
```

---

### Step 2: Python Environment & Backend Setup
1. **Create a virtual environment**:
   ```bash
   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate

   # On Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # IMPORTANT AUDIT NOTE: Install Flask-SocketIO and openai if not in requirements:
   pip install Flask-SocketIO>=5.3.6 openai>=1.12.0 pytest
   ```

---

### Step 3: Configure Environment Variables
1. Copy the template `.env.example` to `.env` in the repository root and in `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Populate the environment variables:
   ```ini
   # Environment & Server Port
   FLASK_ENV=development
   FLASK_PORT=5000
   SECRET_KEY=dev_secret_key_change_in_production_12345

   # MongoDB Connection String
   MONGO_URI=mongodb://localhost:27017/careerpilot_ai

   # JWT Authentication Secret & Lifespan
   JWT_SECRET=supersecret_jwt_dev_key_change_in_production
   JWT_EXPIRATION_HOURS=24

   # AI Provider Configuration (gemini, openai, fallback, or auto)
   AI_PROVIDER=auto
   GEMINI_API_KEY=your_google_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   AI_FALLBACK_ENABLED=true

   # Frontend Client URL (for CORS)
   FRONTEND_URL=http://localhost:5173

   # Background Scheduler (set to false if running multiple debug reloads)
   ENABLE_BACKGROUND_SCHEDULER=true
   OPPORTUNITY_SEED_ON_STARTUP=true
   ```

---

### Step 4: Verify MongoDB Connectivity
Ensure MongoDB is running locally:
```bash
# On Linux/macOS
mongosh --eval "db.adminCommand('ping')"

# Or via Python quick test:
python -c "from pymongo import MongoClient; print(MongoClient('mongodb://localhost:27017').admin.command('ping'))"
```
You should see: `{'ok': 1.0}`.

---

### Step 5: Start the Backend Server
```bash
cd backend
python run.py
```
Output:
```
>> CareerPilot AI Backend running at http://localhost:5000
>> Health check endpoint: http://localhost:5000/api/health
```
Verify the server is healthy by opening `http://localhost:5000/api/health` in your browser.

---

### Step 6: Frontend Dependency Installation & Startup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Output:
```
  VITE v5.4.11  ready in 420 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
Open `http://localhost:5173` in Google Chrome or Microsoft Edge.

---

## 4. Running Verification & Acceptance Tests

### 1. Zero-Mock Production Acceptance Scanner
Run from the root directory:
```bash
node scripts/check-no-mocks.js
```
*Expected*: Scans 246 files; returns exit code 0 (`PASSED`).

### 2. AI Resilience & Safety Pytest Suite
```bash
pytest backend/tests/test_ai_provider_resilience.py -v
```
*Expected*: 12 passed in ~2.4 seconds.

### 3. Full Integration Test Suite (Requires local MongoDB)
```bash
pytest backend/tests/ -q
```

---

## 5. Common Troubleshooting & Error Resolution

| Error / Symptom | Root Cause | Solution |
|---|---|---|
| `ModuleNotFoundError: No module named 'flask_socketio'` | Package was omitted from `backend/requirements.txt`. | Run `pip install Flask-SocketIO>=5.3.6`. |
| `ServerSelectionTimeoutError: localhost:27017` | MongoDB service is not started on your machine. | Start MongoDB service (`net start MongoDB` on Windows, or `brew services start mongodb-community` on macOS, or `sudo systemctl start mongod` on Linux). |
| `AIAuthenticationError: Gemini authentication failed` | Invalid or expired `GEMINI_API_KEY` in `.env`. | Verify your API key in Google AI Studio or set `AI_PROVIDER=fallback` for offline testing. |
| Browser Speech Recognition not listening | Microphone permissions blocked or unsupported browser. | Use Google Chrome or Microsoft Edge; click the padlock icon in the browser address bar to allow microphone access. |
| CORS Preflight Error in Browser Console | Frontend port mismatch. | Ensure `FRONTEND_URL` in `.env` matches your Vite dev server port (default: `http://localhost:5173`). |
| Upload fails with `FILE_TOO_LARGE` | Resume exceeds 10 MB limit. | Compress your PDF resume or use a file under 10 megabytes. |
| Duplicate background jobs executing | Flask debug reloader spawning multiple worker processes. | `init_scheduler` checks `WERKZEUG_RUN_MAIN`; set `ENABLE_BACKGROUND_SCHEDULER=false` if running with custom reloaders. |

