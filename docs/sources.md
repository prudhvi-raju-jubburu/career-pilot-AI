# External Opportunity Ingestion Sources & Data Pipeline Architecture

## 1. Overview
CareerPilot AI continuously scans, validates, deduplicates, and ingests live opportunities across multiple external public platforms. Ingestion runs via scheduled background tasks (APScheduler) and on-demand administrator triggers (`POST /api/sources/sync`).

All opportunities undergo schema normalization, SHA-256 content fingerprinting, title + company fuzzy deduplication (`difflib.SequenceMatcher` threshold ≥ 0.85), and real-time broadcast via Server-Sent Events (SSE).

---

## 2. Active External Data Sources

### Source 1: Remotive API
- **Endpoint**: `https://remotive.com/api/remote-jobs`
- **Terms & Legal Review**:
  - Open public JSON API provided by Remotive for developer usage and job syndication.
  - No scraping required; respects open web syndication.
  - Identified via descriptive User-Agent: `CareerPilotAI-Bot/1.0 (+https://careerpilot.ai/bot)`.
- **Category / Type**: Remote Software Engineering Jobs & Internships (`internship`, `job`).
- **Update Frequency / Schedule**: Every 4 hours (`interval: hours=4`).
- **Rate Limit & Circuit Breaker**:
  - Throttled at max 1 request per 10 seconds.
  - Circuit breaker trips after 3 consecutive errors; cool-down period 300 seconds.
- **Normalization Mapping**:
  - `title` ← `job.title`
  - `company` ← `job.company_name`
  - `description` ← HTML-cleaned `job.description`
  - `url` ← `job.url`
  - `location` ← `job.candidate_required_location` or `"Remote"`
  - `salary` ← `job.salary` (if specified)
  - `skills` ← Extracted from `job.tags`

---

### Source 2: Unstop India Tech Opportunities API
- **Endpoint**: `https://unstop.com/api/public/opportunity/search-result?opportunity=internships&category=engineering&per_page=30`
- **Terms & Legal Review**:
  - Official public discovery endpoint used by Unstop for students and developers across India.
  - Read-only queries for educational career discovery and internship applications.
  - Polite indexing with custom User-Agent identifying CareerPilot bot.
- **Category / Type**: Indian Tech Engineering Internships & Developer Fresher Jobs (`internship`, `job`).
- **Update Frequency / Schedule**: Every 4 hours (`interval: hours=4`).
- **Rate Limit & Circuit Breaker**:
  - Throttled at max 1 request per 10 seconds.
  - Circuit breaker trips after 3 consecutive failures.
- **Normalization Mapping**:
  - `title` ← `item.title`
  - `company` ← `item.organisation.name`
  - `description` ← Plaintext clean description from Unstop listing
  - `url` ← `https://unstop.com/{item.public_url}` or application URL
  - `location` ← Indian Tech Hub (`Bengaluru`, `Hyderabad`, `Pune`, `Noida`, `Mumbai`, `Delhi NCR`, `Chennai`) with State and `country: "India"`
  - `work_mode` ← `"Remote"` / `"Onsite"` / `"Hybrid"`
  - `compensation` ← Real INR stipend (`currency: "INR"`, `min_amount`, `max_amount`)
  - `skills` ← Normalized technical skills from job requirements tag list

---

### India Tech Ecosystem Eligibility Rule (`is_india_eligible`)
All opportunities ingested across any feed undergo strict geographical validation before entering the database:
1. **Direct Indian Hubs**: Roles located in Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR/Noida/Gurgaon, Chennai, Kolkata, Ahmedabad, etc.
2. **India-Eligible Remote**: Remote software developer roles explicitly verified as open to India, APAC, or Worldwide.
3. **Rejection of Foreign-Exclusive Roles**: Strict exclusion of USA-only, Europe-only, UK-only, or German-specific listings (e.g. Berlin, Munich).
4. **Student Hackathons & CP**: Indian university hackathons (Devfolio, SIH) and global competitive programming open to Indian students (Codeforces).

---

### Source 3: Codeforces Contests API
- **Endpoint**: `https://codeforces.com/api/contest.list?gym=false`
- **Terms & Legal Review**:
  - Official, documented public API (`https://codeforces.com/apiHelp`).
  - Terms permit non-commercial and educational querying of contest schedules.
  - Max 5 requests per second permitted by Codeforces; CareerPilot queries once per hour.
- **Category / Type**: Competitive Programming Contests & Coding Sprints (`coding_contest`).
- **Update Frequency / Schedule**: Every 1 hour (`interval: hours=1`).
- **Rate Limit & Circuit Breaker**:
  - Throttled to 1 request per 10 seconds with 5s timeout.
  - Parses upcoming or recently active contests (`phase != "FINISHED"` or duration within horizon).
- **Normalization Mapping**:
  - `title` ← `contest.name`
  - `company` ← `"Codeforces"`
  - `type` ← `"coding_contest"`
  - `description` ← Formatted contest specification with duration and type.
  - `url` ← `https://codeforces.com/contests/{contest.id}`
  - `dates.deadline` ← ISO 8601 converted from `startTimeSeconds`
  - `skills` ← `["Data Structures & Algorithms", "C++", "Python", "Competitive Programming"]`

---

### Source 4: Devfolio Hackathons API
- **Endpoint**: `https://api.devfolio.co/api/hackathons`
- **Terms & Legal Review**:
  - Public directory JSON API powering Devfolio's open explore directory.
  - Read-only queries for student discovery of collegiate and developer hackathons.
- **Category / Type**: University Hackathons & Innovation Sprints (`hackathon`).
- **Update Frequency / Schedule**: Every 6 hours (`interval: hours=6`).
- **Rate Limit & Circuit Breaker**:
  - 1 request per 10 seconds; backoff on rate limits.
- **Normalization Mapping**:
  - `title` ← `item.name`
  - `company` ← `item.organizer_name` or `"Devfolio Partner"`
  - `type` ← `"hackathon"`
  - `description` ← `item.tagline` / `item.description`
  - `url` ← `https://{item.slug}.devfolio.co`
  - `dates.deadline` ← Application or submission deadline in ISO format.
  - `location` ← `item.location` or `"Online / Virtual"`
  - `skills` ← `["Full Stack", "APIs", "Hackathon Sprints", "Product Development"]`

---

### Source 5: OpportunityDesk Scholarships RSS Feed
- **Endpoint**: `https://opportunitydesk.org/feed/`
- **Terms & Legal Review**:
  - Standard syndication RSS 2.0 XML feed specifically published for aggregators.
  - Open redistribution for student educational advancement.
- **Category / Type**: Fellowships, Grants & Scholarships (`scholarship`, `fellowship`).
- **Update Frequency / Schedule**: Every 12 hours (`interval: hours=12`).
- **Rate Limit & Circuit Breaker**:
  - 1 request per 30 seconds; XML parsing via BeautifulSoup (`xml`/`lxml`).
- **Normalization Mapping**:
  - `title` ← `item.title`
  - `company` ← Extracted provider or `"OpportunityDesk Partner"`
  - `type` ← `"scholarship"` or `"fellowship"`
  - `description` ← Cleaned summary of criteria and award details.
  - `url` ← `item.link`
  - `skills` ← `["Research", "Academic Excellence", "Leadership"]`

---

## 3. Unsupported / Prohibited Sources Policy

The following external sites were evaluated and explicitly marked **UNSUPPORTED / PROHIBITED** from direct automated scraping in compliance with terms of service, robots.txt, and authentication restrictions:

1. **LinkedIn Jobs**: Prohibits automated scrapers without LinkedIn Talent Solutions enterprise partner licenses.
2. **Indeed**: Strict bot detection and CAPTCHAs; unauthorized automated access prohibited.
3. **The Muse API**: Restricts open querying without approved developer API keys (returns 403 Forbidden).
4. **Devpost RSS**: Returned 406 Not Acceptable on standard syndication requests.
5. **Handshake**: Gated behind university Single Sign-On (SSO) authentication.

CareerPilot AI strictly connects to open, compliant, public APIs and syndication feeds.

---

## 4. Pipeline Deduplication & Telemetry Architecture

```
[External Connectors (5 Sources)]
              │
              ▼
    [Connector Base Validation]
     - HTTP Headers + Bot User-Agent
     - Exponential Backoff & Circuit Breaker
              │
              ▼
   [Content Hashing & Fuzzy Deduplication]
     - SHA-256 dedupe hash: sha256(canonical(title) + canonical(company))
     - Fuzzy matching: SequenceMatcher(title + company) >= 0.85
              │
              ▼
        [MongoDB Upsert]
     - Collection: `opportunities`
     - Status: `active`
              │
              ├───────────────────────────────┐
              ▼                               ▼
    [Live SSE Broker]               [Source Run Telemetry]
     - EventStreamManager            - Collection: `source_runs`
     - /api/stream/opportunities     - Status, duration, fetched/accepted counts
```

### Operational & Diagnostic Endpoints
- `GET /api/sources/health`: (Protected) Comprehensive operational diagnostic reporting overall health (`healthy`, `degraded`, `unhealthy`), individual connector states (failures, circuit breakers, success rates), recent error classifications (`not_found`, `timeout`, `rate_limited`, `network_error`), and database freshness metrics.
- `GET /api/sources/status`: Reports live operational health, items accepted, error status, and last synced timestamp for each registered connector.
- `POST /api/sources/sync`: Authenticated endpoint allowing instant manual synchronization across all sources.

---

## 5. Phase 2 Resilience & Reliability Enhancements

1. **Sub-Resource Failure Isolation**:
   - In aggregators like `ATSConnector` (Greenhouse, Lever, SmartRecruiters), individual company board 404s are flagged with `record_failure=False` during HTTP requests. Defunct company boards are skipped without tripping the connector's global circuit breaker.
2. **Safe Deadline Comparison**:
   - Date-only deadlines (e.g. `YYYY-MM-DD`) are normalized to end-of-day UTC (`23:59:59+00:00`) so opportunities remain discoverable throughout their final calendar day regardless of local client timezones.
3. **Idempotent Ingestion & Content Deduplication**:
   - Updates utilize atomic upserts with SHA-256 fingerprint matching on title and company slugs, preserving user applications and saved status across ingestion runs.

