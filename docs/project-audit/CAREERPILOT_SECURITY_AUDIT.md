# CareerPilot AI — Security, Privacy & Data Protection Audit

## 1. Executive Security Summary
This security audit was conducted by inspecting the codebase across all backend routes, models, services, utility functions, configuration files, and frontend communication layers.

CareerPilot AI exhibits strong baseline security practices in authentication, password hashing, prompt-injection defense, cross-user data isolation, and cascading data deletion. However, critical deployment blockers and security hardening items were identified that must be remediated prior to multi-tenant cloud staging.

---

## 2. Security Assessment Matrix

| Security Domain | Implementation Evidence | Tests Available | Remaining Weaknesses / Risks | Severity | Recommended Remediation |
|---|---|---|---|---|---|
| **Password Hashing** | `werkzeug.security.generate_password_hash` with `method='pbkdf2:sha256'` in `UserModel`. | `test_auth.py`, `test_change_password.py` | PBKDF2/SHA256 is functional, but Argon2id or bcrypt is preferred for modern password storage. | **P2** | Migrate to `werkzeug.security.generate_password_hash(..., method='scrypt')` or `argon2-cffi`. |
| **JWT Security** | Signed with HS256, 24-hour expiration, payload includes `sub`, `email`, `iat`, `exp` in `app/utils/auth.py`. | `test_auth.py`, `test_admin_security.py` | Secret key defaults to `"supersecret_jwt_dev_key"` if environment variable is missing. No token revocation blacklist in Redis. | **P1** | Enforce startup assertion preventing server boot if `JWT_SECRET` is default in production; implement token blocklist for immediate logout. |
| **Authentication Middleware** | `@token_required` and `@admin_required` decorators inspect Authorization Bearer headers. | `test_auth.py`, `test_admin_security.py` | None in core flow; user record is re-queried from DB to verify active status on each call. | **P3** | Low risk; add short-lived cache (Redis) if database query per request causes latency at scale. |
| **Role Authorization** | `@admin_required` checks `user.get("role") == "admin"`. | `test_admin_security.py` | Binary role system (`student` vs `admin`); no granular permission scopes. | **P3** | Acceptable for current project scope; consider role-permission mapping if multi-role staff added. |
| **Cross-User Data Isolation** | Queries in `profile.py`, `application.py`, `copilot.py` enforce `user_id = str(current_user["_id"])`. | `test_account_deletion.py`, `test_copilot_rag.py` | Strong isolation verified; no route allows reading another student's applications or copilot chat by ID parameter tampering. | **P3** | Verified secure. |
| **CORS Policy** | Configured in `app/__init__.py` with `CORS(app, resources={r"/api/*": ...})`. | Manual / integration | `origins: ["*"]` is wildcarded in development configuration; `FRONTEND_URL` is read but wildcard is permitted in options preflight. | **P1** | Restrict `Access-Control-Allow-Origin` strictly to `FRONTEND_URL` in production environments; disable wildcard when credentials allowed. |
| **CSRF Protection** | Stateless Bearer JWT stored in `localStorage` and passed via `Authorization` header. | Standard architecture | Since cookies are not used for authentication, classic CSRF attacks cannot forge authenticated requests. However, tokens in `localStorage` are vulnerable to XSS. | **P2** | Ensure XSS defenses remain bulletproof; consider migrating to HttpOnly, SameSite=Strict cookies for web sessions. |
| **File Upload Validation** | Extension whitelist (`{"pdf", "docx"}`), 10 MB size limit, `secure_filename` in `routes/resume.py`. | `test_profile_resume.py` | File extension is checked via filename extension string rather than inspecting magic bytes (MIME type sniffing). | **P1** | Add `python-magic` or header byte inspection (`%PDF` magic byte check) to prevent malicious executable files disguised as `.pdf`. |
| **File Access Control** | Files stored in `uploads/resumes/{user_id}/`. API endpoints never serve raw files without auth. `filePath` stripped from responses. | `test_profile_resume.py` | Local disk storage path could be exposed if an unhandled traceback leaks server exception details. | **P2** | Ensure generic 500 handler suppresses server filesystem paths in all environments. |
| **SSRF Prevention** | Connectors query only hardcoded, verified domains (Unstop, Devfolio, Remotive, Codeforces). | `verify_ssrf_and_deletion_deep.py` | `ATSConnector` reads domains from `company_registry.json`. If user-controlled URL input is added in future, SSRF checks must be enforced. | **P2** | Maintain strict domain whitelisting and reject RFC 1918 private IP addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.1). |
| **MongoDB Query Safety** | Uses PyMongo typed dictionaries with direct key assignment. | `test_dedup_and_recommendations.py` | Regex queries in opportunity search must escape special characters to prevent ReDoS (Regular Expression Denial of Service). | **P2** | Apply `re.escape()` to all user-supplied search parameters before injecting into `$regex` queries. |
| **API Rate Limiting** | Not implemented at application level (relies on reverse proxy / Nginx). | None | Without Flask-Limiter, authentication routes (`/api/auth/login`) are vulnerable to brute-force credential stuffing. | **P1** | Integrate `Flask-Limiter` with in-memory or Redis backend to cap login attempts at 5 requests/minute per IP. |
| **Secret Management** | Loaded via `python-dotenv` from `.env`. Example template provided in `.env.example`. | Configuration audit | Sensitive `.env` is present in local repository (must never be committed to git). `.gitignore` correctly lists `.env`. | **P1** | Verify `.gitignore` prevents `.env` check-in; rotate all development keys before deploying to public staging. |
| **PII & Logging Hygiene** | Loggers log actions with `user_id`. Resume text stripped before logging. Audit logs store zero PII. | `test_copilot_rag_evaluation.py` | Ensure unhandled exception handler does not dump raw request payloads containing student names or passwords into server logs. | **P2** | Verified that `AuditLogModel` records only `actor_id` and counts without name/email. |
| **Cascading Account Deletion** | Staged deletion across 14 personal collections, physical disk cleanup, Socket.IO deactivation. | `test_account_deletion.py`, `verify_ssrf_and_deletion_deep.py` | Verified complete cascading purge. Zero orphaned records remain in personal collections. | **P3** | Verified secure. |
| **AI Provider Data Safety** | System injection directives, delimiter isolation (`<<<UNTRUSTED_...>>>`), control character stripping. | `test_ai_provider_resilience.py` | Third-party LLM providers (Google, OpenAI) receive student resume and project text for processing under their respective API enterprise terms. | **P2** | Ensure production API agreements with Google Cloud and OpenAI have zero-data-retention (ZDR) clauses enabled. |

---

## 3. Critical Findings & Prioritized Remediation Plan

### Priority 0 (Critical — Immediate Security Blocker)
*None identified. No hardcoded backdoor passwords, unauthenticated administrative access, or direct remote code execution vulnerabilities were found in the codebase.*

### Priority 1 (High — Must Resolve Before Staging)
1. **Missing Production Rate Limiting**: The authentication endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/change-password`) lack rate-limiting middleware. A malicious actor could launch brute-force password attacks or flood registration.
   - *Fix*: Install `Flask-Limiter` and apply `@limiter.limit("5 per minute")` on `/api/auth/login`.
2. **CORS Wildcard in Production**: While `add_cors_headers` checks the incoming origin, fallback to `"*"` is active. Wildcard origins combined with `Access-Control-Allow-Credentials: true` represent a browser security hazard.
   - *Fix*: Require an explicit list of allowed staging and production domains in `FRONTEND_URL`.
3. **MIME Magic Byte Validation on Uploads**: Resumes are currently validated solely by checking `.pdf` or `.docx` file extensions. An attacker could rename a malicious shell script to `exploit.pdf` and upload it.
   - *Fix*: Inspect the initial 4 bytes of uploaded files to verify `%PDF` (`\x25\x50\x44\x46`) or ZIP container magic bytes for DOCX (`\x50\x4B\x03\x04`).
4. **Missing Dependencies in `requirements.txt`**: `Flask-SocketIO` and `openai` are imported in production code but missing from `backend/requirements.txt`.
   - *Fix*: Add `Flask-SocketIO>=5.3.6` and `openai>=1.12.0` to `requirements.txt`.

### Priority 2 (Medium — Important Hardening)
1. **ReDoS Protection in MongoDB Regex**: Ensure all keyword searches in `opportunity_bp` and `admin_bp` wrap input strings with `re.escape()` before building `$regex` filters.
2. **JWT Secret Boot Assertion**: Add an assertion in `create_app()` raising an exception if `app.config["ENV"] == "production"` and `JWT_SECRET` contains `"supersecret"` or `"careerpilot_default"`.
3. **Password Hashing Algorithm Upgrade**: Upgrade default hash generation from PBKDF2/SHA256 to Argon2id (`argon2-cffi`) or Scrypt.

### Priority 3 (Low — Quality of Life & Observability)
1. **Fine-Grained Role Permissions**: Extend binary student/admin roles to support campus placement coordinators with read-only batch analytics.
2. **SIEM Audit Log Forwarding**: Configure audit logs to stream to cloud monitoring (AWS CloudWatch, Datadog) for centralized intrusion detection.

