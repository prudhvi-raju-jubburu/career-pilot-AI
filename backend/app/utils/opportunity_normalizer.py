import re
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from app.utils.skill_normalizer import normalize_skill, normalize_skill_list, SKILL_ALIASES

CANONICAL_TYPES = {
    "internship": ["internship", "intern", "summer intern", "co-op", "coop", "fall intern", "spring intern", "winter intern"],
    "job": ["job", "full-time", "fulltime", "fresher", "graduate", "junior", "associate", "entry level", "entry-level", "permanent"],
    "scholarship": ["scholarship", "grant", "bursary", "financial aid"],
    "hackathon": ["hackathon", "hack", "codeathon", "datathon"],
    "coding_contest": ["coding_contest", "contest", "competitive programming", "code competition", "challenge"],
    "workshop": ["workshop", "bootcamp", "training", "seminar", "masterclass"],
    "conference": ["conference", "summit", "symposium"],
    "fellowship": ["fellowship", "fellow", "residency"],
    "other": ["other", "miscellaneous"]
}

CANONICAL_CATEGORIES = {
    "software": ["software", "sde", "swe", "backend", "systems", "full stack", "fullstack", "programming", "software engineering"],
    "artificial_intelligence": ["artificial_intelligence", "ai", "artificial intelligence", "ml", "machine learning", "deep learning", "nlp", "llm", "generative ai"],
    "data": ["data", "data science", "data analytics", "data engineer", "data analyst", "business intelligence"],
    "cybersecurity": ["cybersecurity", "security", "infosec", "penetration testing", "soc"],
    "cloud": ["cloud", "aws", "azure", "gcp", "cloud computing"],
    "devops": ["devops", "sre", "site reliability", "infrastructure", "ci/cd", "platform"],
    "web_development": ["web_development", "frontend", "web", "ui/ux", "web development", "react", "html/css"],
    "mobile_development": ["mobile_development", "android", "ios", "flutter", "react native", "mobile"],
    "electronics": ["electronics", "vlsi", "embedded", "iot", "hardware", "ece"],
    "mechanical": ["mechanical", "robotics", "automotive", "cad"],
    "civil": ["civil", "structural", "construction"],
    "business": ["business", "product", "product management", "marketing", "operations"],
    "finance": ["finance", "fintech", "banking", "quantitative"],
    "research": ["research", "academic", "phd", "laboratory"],
    "general": ["general"]
}

COMMON_SKILLS_VOCABULARY = [
    "Python", "C++", "C", "C#", "Java", "JavaScript", "TypeScript", "Go", "Rust", "SQL",
    "HTML/CSS", "React", "Next.js", "Vue.js", "Angular", "Tailwind CSS", "Redux",
    "Node.js", "Express", "Flask", "Django", "FastAPI", "Spring Boot", "REST APIs", "GraphQL",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "SQLite",
    "Data Structures & Algorithms", "Object-Oriented Programming (OOP)", "Operating Systems",
    "Computer Networks", "Database Management Systems", "System Design", "Distributed Systems",
    "Git", "Docker", "Kubernetes", "AWS", "Google Cloud Platform (GCP)", "Microsoft Azure", "CI/CD", "Linux / Bash",
    "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-Learn",
    "Large Language Models (LLMs)", "Retrieval Augmented Generation (RAG)", "Vector Databases",
    "Natural Language Processing (NLP)", "Computer Vision"
]

def normalize_opportunity_type(raw_type: Optional[str]) -> str:
    """Maps arbitrary opportunity types to canonical lowercase types."""
    if not raw_type or not isinstance(raw_type, str):
        return "other"
    clean = raw_type.strip().lower().replace("-", " ").replace("_", " ")
    for canonical, aliases in CANONICAL_TYPES.items():
        if clean == canonical:
            return canonical
        for alias in aliases:
            norm_alias = alias.replace("-", " ").replace("_", " ")
            if norm_alias == clean or re.search(r'\b' + re.escape(norm_alias) + r'\b', clean):
                return canonical
    return "other"

def normalize_category(raw_category: Optional[str], title: str = "", description: str = "") -> str:
    """Normalizes or infers canonical opportunity category."""
    text_to_check = f"{raw_category or ''} {title} {description}".lower()
    if raw_category and isinstance(raw_category, str):
        clean = raw_category.strip().lower().replace("-", "_").replace(" ", "_")
        if clean in CANONICAL_CATEGORIES:
            return clean

    for canonical, aliases in CANONICAL_CATEGORIES.items():
        if canonical == "general":
            continue
        for alias in aliases:
            if re.search(r'\b' + re.escape(alias) + r'\b', text_to_check):
                return canonical
    return "general"

def normalize_work_mode(raw_mode: Optional[str], is_remote: bool = False) -> str:
    """Normalizes work mode into Remote, Hybrid, or Onsite."""
    if is_remote:
        return "Remote"
    if not raw_mode or not isinstance(raw_mode, str):
        return "Onsite"
    clean = raw_mode.strip().lower()
    if "remote" in clean or "virtual" in clean or "work from home" in clean or "wfh" in clean:
        return "Remote"
    if "hybrid" in clean or "flexible" in clean:
        return "Hybrid"
    if "onsite" in clean or "on-site" in clean or "office" in clean or "in-person" in clean:
        return "Onsite"
    return "Onsite"

def normalize_location(raw_loc: Any) -> Dict[str, Any]:
    """Extracts city, state, country, and remote status from location input."""
    result = {
        "city": None,
        "state": None,
        "country": None,
        "is_remote": False
    }
    if not raw_loc:
        return result

    if isinstance(raw_loc, dict):
        result["city"] = str(raw_loc.get("city")).strip() if raw_loc.get("city") else None
        result["state"] = str(raw_loc.get("state")).strip() if raw_loc.get("state") else None
        result["country"] = str(raw_loc.get("country")).strip() if raw_loc.get("country") else None
        result["is_remote"] = bool(raw_loc.get("is_remote", False))
        return result

    loc_str = str(raw_loc).strip()
    if not loc_str:
        return result

    if "remote" in loc_str.lower() or "anywhere" in loc_str.lower():
        result["is_remote"] = True

    parts = [p.strip() for p in loc_str.split(",") if p.strip()]
    if len(parts) == 1:
        if result["is_remote"]:
            result["city"] = "Remote"
        else:
            result["city"] = parts[0]
    elif len(parts) == 2:
        result["city"] = parts[0]
        result["country"] = parts[1]
    elif len(parts) >= 3:
        result["city"] = parts[0]
        result["state"] = parts[1]
        result["country"] = parts[-1]

    return result

def parse_iso_deadline(raw_deadline: Any) -> Optional[str]:
    """Parses various date representations into standard ISO 8601 UTC string."""
    if not raw_deadline:
        return None
    if isinstance(raw_deadline, datetime):
        if raw_deadline.tzinfo is None:
            raw_deadline = raw_deadline.replace(tzinfo=timezone.utc)
        return raw_deadline.astimezone(timezone.utc).isoformat()

    s = str(raw_deadline).strip()
    if not s:
        return None

    formats = [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%b %d, %Y",
        "%B %d, %Y",
        "%d %b %Y",
        "%d %B %Y"
    ]

    clean_s = s.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(clean_s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        pass

    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except Exception:
            continue

    return None

def extract_skills_from_text(text: str, existing_skills: Optional[List[str]] = None) -> List[str]:
    """Deterministically extracts explicit technical skills using vocabulary and skill_normalizer."""
    found = set()
    if existing_skills:
        for sk in normalize_skill_list(existing_skills):
            found.add(sk)

    if not text:
        return sorted(list(found))

    lower_text = text.lower()
    # 1. Match against known aliases (sorted by length descending for greedy match)
    for alias, canonical in sorted(SKILL_ALIASES.items(), key=lambda x: len(x[0]), reverse=True):
        pattern = r'(?<![a-zA-Z0-9_])' + re.escape(alias) + r'(?![a-zA-Z0-9_])'
        if re.search(pattern, lower_text):
            found.add(canonical)

    # 2. Match against common vocabulary
    for vocab_skill in COMMON_SKILLS_VOCABULARY:
        pattern = r'(?<![a-zA-Z0-9_])' + re.escape(vocab_skill.lower()) + r'(?![a-zA-Z0-9_])'
        if re.search(pattern, lower_text):
            canonical = normalize_skill(vocab_skill)
            if canonical:
                found.add(canonical)

    return sorted(list(found))

def generate_dedupe_key(
    source_name: str,
    external_id: Optional[str] = None,
    org_name: str = "",
    title: str = "",
    application_url: str = "",
    location_city: Optional[str] = None,
    deadline: Optional[str] = None
) -> str:
    """
    Computes a deterministic deduplication hash for an opportunity.
    Priority:
      1. source_name + ":" + external_id
      2. SHA256 of normalized org + title + application_url
      3. SHA256 of normalized org + title + location + deadline
    """
    if source_name and external_id:
        return f"{source_name.strip().lower()}:{str(external_id).strip()}"

    norm_org = re.sub(r'[^a-z0-9]', '', (org_name or '').lower())
    norm_title = re.sub(r'[^a-z0-9]', '', (title or '').lower())
    norm_url = (application_url or '').strip().lower().split('?')[0].rstrip('/')

    if norm_org and norm_title and norm_url:
        payload = f"{norm_org}|{norm_title}|{norm_url}"
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    loc_str = (location_city or '').strip().lower()
    dead_str = (deadline or '').strip()
    payload = f"{norm_org}|{norm_title}|{loc_str}|{dead_str}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()
