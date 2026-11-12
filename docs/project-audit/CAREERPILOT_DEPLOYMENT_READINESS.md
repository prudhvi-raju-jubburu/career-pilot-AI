# CareerPilot AI — Deployment Readiness, Hosting Architecture & Production Operations

## 1. Executive Deployment Assessment
CareerPilot AI is feature-complete in local development with real database models, zero mocks, and functional real-time telemetry. However, transitioning from a single-process local development environment (`python run.py`) to a multi-instance cloud production environment introduces critical architectural considerations regarding WSGI/ASGI servers, WebSocket concurrency, file persistence, and background job duplication.

This document outlines the exact deployment requirements, configuration checklist, infrastructure blockers, and operational guidelines for staging and production rollout.

---

## 2. Infrastructure & Hosting Requirements

### 2.1 Backend Runtime Architecture
- **WSGI / Concurrency Server**: 
  - In local development, `run.py` uses `socketio.run(app, debug=True, allow_unsafe_werkzeug=True)`.
  - In staging/production, Werkzeug is strictly forbidden. The application requires Gunicorn with an asynchronous worker class compatible with Flask-SocketIO and SSE:
    ```bash
    # Single-worker asynchronous deployment (Suitable for small/medium instances)
    gunicorn --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 -b 0.0.0.0:5000 run:app
    
    # Or with eventlet:
    gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:5000 run:app
    ```
- **Reverse Proxy (Nginx / Cloudflare)**:
  - **Buffering**: Crucial for Server-Sent Events (SSE). Nginx must set `proxy_buffering off;` and respect the backend header `X-Accel-Buffering: no;`.
  - **WebSocket Upgrade**: Nginx must proxy headers for Socket.IO:
    ```nginx
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    ```
  - **Timeouts**: SSE streams and chat generation require extended proxy read timeouts (`proxy_read_timeout 300s;`).

### 2.2 Database (MongoDB)
- **Version**: MongoDB 7.0+ (MongoDB Atlas M10+ recommended for staging/production).
- **Index Provisioning**: `create_app()` automatically calls `.ensure_indexes()` across all 15 model classes on application startup, guaranteeing that compound and unique indexes are provisioned before accepting traffic.
- **Connection Pooling**: PyMongo handles connection pooling automatically (`maxPoolSize=100`).

### 2.3 Distributed Cache & Message Queue (Redis)
- **Required for Multi-Worker Deployments**:
  - If backend runs more than 1 Gunicorn worker process or runs across multiple container replicas, Socket.IO in-memory threading will fail to broadcast messages between users on different worker processes.
  - A Redis instance is required (`REDIS_URL=redis://...`), which `app/socket.py` automatically detects to initialize the distributed message queue.

### 2.4 Resume Document Storage
- **Current Local Behavior**: Saves uploaded resumes to `uploads/resumes/{user_id}/` on the local container filesystem.
- **Ephemeral Container Risk**: In cloud container environments (Render, AWS ECS, Heroku, Railway), local files are ephemeral and wiped upon container restart or redeploy.
- **Production Requirement**: A persistent volume mount or cloud object storage adapter (AWS S3, Google Cloud Storage, or Cloudinary) must be configured so uploaded resumes persist across redeployments.

---

## 3. Background Scheduler & PaaS Sleep Implications

### 3.1 Duplicate Job Execution Hazard in Multi-Worker Containers
- **Current Behavior**: `init_scheduler(app)` in `backend/app/services/scheduler.py` uses an in-memory `BackgroundScheduler(daemon=True)`.
- **The Hazard**: If Gunicorn starts with `-w 4` (4 worker processes), each worker executes `create_app()` and spawns its own internal `BackgroundScheduler`, resulting in 4 concurrent ingestion runs and 4x duplicate deadline notification emails!
- **Implemented Safeguard**: The codebase provides the `ENABLE_BACKGROUND_SCHEDULER` environment variable:
  - Set `ENABLE_BACKGROUND_SCHEDULER=true` on **only one** designated backend worker or run the scheduler in a dedicated standalone worker process (`python -m app.services.scheduler`).
  - Set `ENABLE_BACKGROUND_SCHEDULER=false` on all web request handling containers.

### 3.2 PaaS Sleep on Free Tiers (Render / Heroku)
- On free PaaS tiers, web services sleep after 15 minutes of inactivity. When asleep, `BackgroundScheduler` stops running, causing scheduled ingestion (every 6 hours) and deadline checks to be missed.
- **Production Requirement**: Use a persistent paid tier or an external cron ping (AWS EventBridge, GitHub Actions Scheduled Workflow, or Cron-Job.org) targeting `POST /api/sources/sync` and `POST /api/notifications/run-deadline-scan` via an administrative API key.

---

## 4. Production Environment Variables Checklist

| Variable Name | Required? | Example Production Value | Purpose |
|---|---|---|---|
| `FLASK_ENV` | **Yes** | `production` | Disables debug mode and Werkzeug reloaders |
| `FLASK_PORT` | **Yes** | `5000` | Port for the backend application server |
| `SECRET_KEY` | **Yes** | `f83a9...64_random_hex_chars` | Flask session and cryptographic signing key |
| `JWT_SECRET` | **Yes** | `e72b1...64_random_hex_chars` | HS256 secret key for signing student JWTs |
| `JWT_EXPIRATION_HOURS` | Optional | `24` | Token lifespan in hours (default: 24) |
| `MONGO_URI` | **Yes** | `mongodb+srv://user:pass@cluster.mongodb.net/careerpilot_prod` | Production MongoDB Atlas connection URI |
| `FRONTEND_URL` | **Yes** | `https://app.careerpilot.ai` | Allowed CORS origin for browser requests |
| `AI_PROVIDER` | Optional | `auto` | Preferred AI provider (`gemini`, `openai`, `fallback`, `auto`) |
| `GEMINI_API_KEY` | **Yes** | `AIzaSy...` | Google Cloud Gemini API key |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Gemini model identifier |
| `OPENAI_API_KEY` | Optional | `sk-proj-...` | OpenAI API key for secondary fallback |
| `OPENAI_MODEL` | Optional | `gpt-4o-mini` | OpenAI model identifier |
| `AI_FALLBACK_ENABLED`| Optional | `true` | Allows falling back to secondary or deterministic engines |
| `ENABLE_BACKGROUND_SCHEDULER` | **Yes** | `true` (Web Worker 1), `false` (Web Workers 2+) | Controls APScheduler instantiation |
| `REDIS_URL` | If Multi-Worker | `redis://default:pass@redis-host:6379/0` | Enables distributed Socket.IO message queue |
| `UPLOAD_FOLDER` | Optional | `/var/data/uploads` | Path to persistent storage mount for resumes |

---

## 5. Deployment Blockers & Prioritized Action Items

### Priority 0 (Critical — Staging Blockers)
1. **Fix `backend/requirements.txt` Dependencies**:
   - `Flask-SocketIO` is imported in `backend/app/socket.py` and `openai` is imported in `backend/app/ai/ai_service.py`. Neither is declared in `backend/requirements.txt`.
   - *Impact*: Any standard container build (`pip install -r requirements.txt`) will fail during boot with `ModuleNotFoundError: No module named 'flask_socketio'`.
   - *Action*: Append `Flask-SocketIO>=5.3.6` and `openai>=1.12.0` to `backend/requirements.txt`.

2. **Persistent Storage for Resume Uploads**:
   - Resumes uploaded to `backend/uploads/` will be destroyed on container restarts on cloud PaaS providers.
   - *Action*: Attach a persistent disk volume to `/uploads` or implement an S3/Cloudinary storage provider interface.

---

### Priority 1 (High — Must Resolve Before Public Beta)
1. **Rate Limiting Middleware on Authentication**:
   - Prevent brute-force password cracking on `/api/auth/login` and DoS flood attacks on `/api/copilot/stream`.
   - *Action*: Add `Flask-Limiter` with an in-memory or Redis storage backend.

2. **CORS Hardening**:
   - Remove wildcard origin handling in production; reject requests whose Origin header does not match `FRONTEND_URL`.

3. **Gunicorn Production Entry Point**:
   - Create a `Procfile` or `Dockerfile` specifying the exact Gunicorn invocation with the `geventwebsocket` or `eventlet` worker class.

---

### Priority 2 (Medium — Recommended Post-Launch Optimizations)
1. **Cloudflare CDN Caching Rules**:
   - Ensure Cloudflare or edge CDN caches static frontend assets (`.js`, `.css`, `.png`) while strictly bypassing cache for `/api/*` and disabling buffering for `/api/stream/*` and `/api/copilot/stream`.

2. **Health Check Monitoring**:
   - Configure external uptime monitor (e.g. BetterStack, UptimeRobot) probing `GET /api/health` every 60 seconds.

