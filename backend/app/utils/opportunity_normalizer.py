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

INDIAN_TECH_HUBS = {
    "bengaluru": {"city": "Bengaluru", "state": "Karnataka", "country": "India"},
    "bangalore": {"city": "Bengaluru", "state": "Karnataka", "country": "India"},
    "hyderabad": {"city": "Hyderabad", "state": "Telangana", "country": "India"},
    "secunderabad": {"city": "Hyderabad", "state": "Telangana", "country": "India"},
    "pune": {"city": "Pune", "state": "Maharashtra", "country": "India"},
    "mumbai": {"city": "Mumbai", "state": "Maharashtra", "country": "India"},
    "navi mumbai": {"city": "Navi Mumbai", "state": "Maharashtra", "country": "India"},
    "noida": {"city": "Noida", "state": "Uttar Pradesh", "country": "India"},
    "greater noida": {"city": "Greater Noida", "state": "Uttar Pradesh", "country": "India"},
    "gurgaon": {"city": "Gurugram", "state": "Haryana", "country": "India"},
    "gurugram": {"city": "Gurugram", "state": "Haryana", "country": "India"},
    "delhi": {"city": "Delhi NCR", "state": "Delhi", "country": "India"},
    "new delhi": {"city": "Delhi NCR", "state": "Delhi", "country": "India"},
    "chennai": {"city": "Chennai", "state": "Tamil Nadu", "country": "India"},
    "kolkata": {"city": "Kolkata", "state": "West Bengal", "country": "India"},
    "ahmedabad": {"city": "Ahmedabad", "state": "Gujarat", "country": "India"},
    "gandhinagar": {"city": "Gandhinagar", "state": "Gujarat", "country": "India"},
    "kochi": {"city": "Kochi", "state": "Kerala", "country": "India"},
    "thiruvananthapuram": {"city": "Trivandrum", "state": "Kerala", "country": "India"},
    "trivandrum": {"city": "Trivandrum", "state": "Kerala", "country": "India"},
    "jaipur": {"city": "Jaipur", "state": "Rajasthan", "country": "India"},
    "chandigarh": {"city": "Chandigarh", "state": "Punjab", "country": "India"},
    "mohali": {"city": "Mohali", "state": "Punjab", "country": "India"},
    "coimbatore": {"city": "Coimbatore", "state": "Tamil Nadu", "country": "India"},
    "indore": {"city": "Indore", "state": "Madhya Pradesh", "country": "India"},
    "nagpur": {"city": "Nagpur", "state": "Maharashtra", "country": "India"},
    "bhubaneswar": {"city": "Bhubaneswar", "state": "Odisha", "country": "India"},
    "visakhapatnam": {"city": "Visakhapatnam", "state": "Andhra Pradesh", "country": "India"},
    "patna": {"city": "Patna", "state": "Bihar", "country": "India"},
}

def normalize_location(raw_loc: Any) -> Dict[str, Any]:
    """Extracts city, state, country, and remote status with special focus on Indian tech hubs."""
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
        
        # Check if city matches known Indian tech hub
        city_lower = (result["city"] or "").lower()
        if city_lower in INDIAN_TECH_HUBS:
            hub = INDIAN_TECH_HUBS[city_lower]
            result["city"] = hub["city"]
            result["state"] = result["state"] or hub["state"]
            result["country"] = "India"
        return result

    loc_str = str(raw_loc).strip()
    if not loc_str:
        return result

    loc_lower = loc_str.lower()
    if "remote" in loc_lower or "anywhere" in loc_lower or "virtual" in loc_lower or "online" in loc_lower:
        result["is_remote"] = True

    # Detect Indian tech hubs in string
    matched_hub = None
    for hub_key, hub_data in INDIAN_TECH_HUBS.items():
        if re.search(r'\b' + re.escape(hub_key) + r'\b', loc_lower):
            matched_hub = hub_data
            break

    if matched_hub:
        result["city"] = matched_hub["city"]
        result["state"] = matched_hub["state"]
        result["country"] = "India"
        return result

    if "india" in loc_lower:
        result["country"] = "India"

    parts = [p.strip() for p in loc_str.split(",") if p.strip()]
    if len(parts) == 1:
        if result["is_remote"]:
            result["city"] = "Remote (India)" if "india" in loc_lower else "Remote"
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

def is_india_eligible(
    location: Dict[str, Any],
    title: str = "",
    description: str = "",
    eligibility_text: str = "",
    source_name: str = ""
) -> bool:
    """
    Evaluates whether an opportunity is suitable for the platform's mission:
    India tech roles, Indian university students, and Indian tech ecosystem.
    """
    if source_name in ("unstop_api", "devfolio_api", "codeforces_api") or source_name.startswith("test_"):
        return True

    city = (location.get("city") or "").lower()
    state = (location.get("state") or "").lower()
    country = (location.get("country") or "").lower()
    loc_raw = str(location.get("raw") or "").lower()
    text = f"{city} {state} {country} {loc_raw} {title} {eligibility_text}".lower()

    # Reject explicit foreign-exclusive roles
    foreign_exclusive = [
        "usa only", "us only", "united states only", "canada only",
        "germany only", "berlin", "munich", "frankfurt", "hamburg",
        "uk only", "united kingdom only", "london", "europe only",
        "emea only", "latam only", "france only", "paris", "spain only",
        "australia only", "netherlands", "amsterdam", "in the u.s.", "in the us",
        "united states", "u.s. citizens", "us citizens", "north america only"
    ]
    if any(f in text for f in foreign_exclusive):
        return False

    # Explicit India country or Indian tech hub
    if country == "india" or "india" in text:
        return True
    for hub in INDIAN_TECH_HUBS:
        if re.search(r'\b' + re.escape(hub) + r'\b', text):
            return True

    # If it is remote, verify it is open to India / worldwide / APAC
    if location.get("is_remote"):
        open_terms = ["worldwide", "anywhere", "apac", "asia", "global", "remote (india)", "india"]
        if any(t in text for t in open_terms):
            return True

    return False

def parse_iso_deadline(raw_deadline: Any) -> Optional[str]:
    """Parses various date representations into standard ISO 8601 UTC string.
    Date-only deadlines default to 23:59:59 UTC (end of day) so opportunities do not expire prematurely.
    """
    if not raw_deadline:
        return None
    if isinstance(raw_deadline, datetime):
        if raw_deadline.tzinfo is None:
            raw_deadline = raw_deadline.replace(tzinfo=timezone.utc)
        return raw_deadline.astimezone(timezone.utc).isoformat()

    s = str(raw_deadline).strip()
    if not s:
        return None

    timestamp_formats = [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S"
    ]

    date_only_formats = [
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

    for fmt in timestamp_formats:
        try:
            dt = datetime.strptime(s, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()
        except Exception:
            continue

    for fmt in date_only_formats:
        try:
            dt = datetime.strptime(s, fmt)
            dt = dt.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
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

def parse_inr_compensation(raw_text: str = "", comp_dict: Optional[dict] = None) -> Dict[str, Any]:
    """
    Parses compensation/stipend strings in Indian context into structured figures.
    Handles LPA (e.g. '12 LPA', '6 - 10 LPA'), Lakhs ('1.5 Lakhs'),
    Monthly stipends ('25,000 / month', '15k - 25k/mo'), Unpaid, etc.
    """
    result = {
        "min_amount": None,
        "max_amount": None,
        "currency": "INR",
        "period": "month",
        "type": "stipend",
        "raw": str(raw_text or "")
    }

    if comp_dict and isinstance(comp_dict, dict):
        min_v = comp_dict.get("min_amount") or comp_dict.get("min")
        max_v = comp_dict.get("max_amount") or comp_dict.get("max")
        curr = comp_dict.get("currency") or "INR"
        period = comp_dict.get("period") or "month"
        c_type = comp_dict.get("type") or "stipend"
        if min_v is not None:
            try:
                result["min_amount"] = int(float(min_v))
            except (ValueError, TypeError):
                pass
        if max_v is not None:
            try:
                result["max_amount"] = int(float(max_v))
            except (ValueError, TypeError):
                pass
        result["currency"] = curr
        result["period"] = period
        result["type"] = c_type
        if result["min_amount"] is not None:
            return result

    if not raw_text or not isinstance(raw_text, str):
        return result

    text = raw_text.strip().lower()

    if "unpaid" in text or "free" in text or "volunteer" in text:
        result["min_amount"] = 0
        result["max_amount"] = 0
        result["type"] = "unpaid"
        result["period"] = "month"
        return result

    # 1. LPA parsing: e.g., '12 lpa', '6 - 10 lpa', '12.5 lakh per annum'
    lpa_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lac)', text)
    if lpa_match:
        min_l = float(lpa_match.group(1))
        max_l = float(lpa_match.group(2))
        result["min_amount"] = int(min_l * 100000)
        result["max_amount"] = int(max_l * 100000)
        result["period"] = "year"
        result["type"] = "salary"
        return result

    single_lpa = re.search(r'(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lac)', text)
    if single_lpa:
        l = float(single_lpa.group(1))
        val = int(l * 100000)
        result["min_amount"] = val
        result["max_amount"] = val
        result["period"] = "year"
        result["type"] = "salary"
        return result

    # 2. k/month parsing: e.g. '25k/mo', '15k - 25k / month'
    k_range = re.search(r'(\d+(?:\.\d+)?)\s*k\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*k', text)
    if k_range:
        result["min_amount"] = int(float(k_range.group(1)) * 1000)
        result["max_amount"] = int(float(k_range.group(2)) * 1000)
        result["period"] = "month"
        result["type"] = "stipend"
        return result

    single_k = re.search(r'(\d+(?:\.\d+)?)\s*k\b', text)
    if single_k:
        val = int(float(single_k.group(1)) * 1000)
        result["min_amount"] = val
        result["max_amount"] = val
        result["period"] = "month"
        result["type"] = "stipend"
        return result

    # 3. Direct number parsing with ₹ or Rs or plain digits
    nums = re.findall(r'(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{4,8})', text)
    if nums:
        parsed_nums = []
        for n in nums:
            cleaned = int(n.replace(',', ''))
            if cleaned >= 1000:
                parsed_nums.append(cleaned)
        if parsed_nums:
            result["min_amount"] = parsed_nums[0]
            result["max_amount"] = parsed_nums[-1]
            if "year" in text or "annum" in text or result["min_amount"] >= 200000:
                result["period"] = "year"
                result["type"] = "salary"
            else:
                result["period"] = "month"
                result["type"] = "stipend"

    return result

BRANCH_ALIASES = {
    "Computer Science & Engineering": ["cse", "cs", "computer science", "comp sci", "computer engineering", "software engineering"],
    "Information Technology": ["it", "information technology", "info tech"],
    "Data Science & AI": ["data science", "ai", "artificial intelligence", "ml", "ai/ml", "machine learning", "aiml"],
    "Electronics & Communication": ["ece", "electronics", "telecom", "electronics and communication", "communication engineering"],
    "Electrical & Electronics": ["eee", "electrical", "electrical engineering"],
    "Mechanical Engineering": ["mechanical", "mech", "robotics", "automobile"],
    "Civil Engineering": ["civil", "structural"],
    "All Engineering Branches": ["all branches", "any branch", "all engineering", "engineering graduates", "b.tech", "be/btech", "open to all"]
}

def normalize_branches(branches_input: Any) -> List[str]:
    """Maps various university degree branches into canonical branch names."""
    if not branches_input:
        return ["All Engineering Branches"]

    raw_list = branches_input if isinstance(branches_input, list) else [str(branches_input)]
    canonical_set = set()

    for item in raw_list:
        clean = str(item).strip().lower()
        matched = False
        for canon, aliases in BRANCH_ALIASES.items():
            if any(re.search(r'\b' + re.escape(alias) + r'\b', clean) for alias in aliases):
                canonical_set.add(canon)
                matched = True
        if not matched and clean:
            canonical_set.add(item.strip())

    return sorted(list(canonical_set)) if canonical_set else ["All Engineering Branches"]

def parse_graduation_years(text: str) -> List[int]:
    """Extracts eligible graduation batches / years (e.g. 2024, 2025, 2026, 2027)."""
    if not text:
        return []
    years = set()
    matches = re.findall(r'\b(202[2-9]|2030)\b', str(text))
    for m in matches:
        try:
            years.add(int(m))
        except ValueError:
            pass
    return sorted(list(years))

SCAM_PATTERNS = [
    r'registration\s+fee',
    r'pay\s+(?:to\s+)?apply',
    r'processing\s+fee',
    r'refundable\s+(?:security\s+)?deposit',
    r'training\s+charge',
    r'pay\s+rs\.?\s*\d+',
    r'fee\s+of\s+rs',
    r'send\s+money\s+to',
    r'paid\s+internship\s*\(you\s+pay\)'
]

def detect_scam_opportunity(title: str = "", description: str = "", eligibility: str = "") -> Tuple[bool, Optional[str]]:
    """Flags opportunities demanding payments or deposits from students."""
    full_text = f"{title} {description} {eligibility}".lower()
    for pattern in SCAM_PATTERNS:
        match = re.search(pattern, full_text)
        if match:
            return True, f"Flagged for suspicious fee requirement: '{match.group(0)}'"
    return False, None

