"""
CareerPilot AI — Lightweight Field-of-Study Taxonomy & Matching
Enables accurate academic discipline and field-of-study alignment for
scholarships, fellowships, and non-technical opportunities.
"""

import re
import logging
from typing import Dict, Any, List, Set, Optional, Tuple

logger = logging.getLogger(__name__)

# Canonical Field-of-Study taxonomy
TAXONOMY = {
    "cs_it": {
        "id": "cs_it",
        "name": "Computer Science & Information Technology",
        "keywords": {
            "computer science", "information technology", "software", "coding", "programming",
            "computer engineering", "cse", "it", "web development", "cloud computing",
            "cybersecurity", "algorithms", "systems", "network"
        },
        "branches": [
            "computer science", "computer science and engineering", "cse",
            "information technology", "software engineering", "computer applications",
            "mca", "bca", "computer systems"
        ]
    },
    "data_ai": {
        "id": "data_ai",
        "name": "Data Science & Artificial Intelligence",
        "keywords": {
            "data science", "artificial intelligence", "machine learning", "ai", "ml",
            "deep learning", "neural networks", "nlp", "computer vision", "analytics",
            "big data", "data engineering", "predictive modeling", "business intelligence"
        },
        "branches": [
            "data science", "artificial intelligence", "ai and data science",
            "machine learning", "ai & ml", "computational data science"
        ]
    },
    "engineering_tech": {
        "id": "engineering_tech",
        "name": "Engineering & Technology",
        "keywords": {
            "engineering", "mechanical", "electrical", "electronics", "civil",
            "aerospace", "chemical", "robotics", "hardware", "telecom", "instrumentation",
            "mechatronics", "manufacturing", "automotive"
        },
        "branches": [
            "mechanical engineering", "civil engineering", "electrical engineering",
            "electronics and communication", "ece", "eee", "chemical engineering",
            "aerospace engineering", "robotics", "mechatronics", "instrumentation"
        ]
    },
    "business_management": {
        "id": "business_management",
        "name": "Business, Economics & Management",
        "keywords": {
            "business", "management", "economics", "finance", "marketing", "commerce",
            "mba", "bba", "entrepreneurship", "accounting", "venture", "strategy",
            "consulting", "operations"
        },
        "branches": [
            "business administration", "mba", "bba", "economics", "commerce",
            "finance", "marketing", "management studies"
        ]
    },
    "life_sciences_healthcare": {
        "id": "life_sciences_healthcare",
        "name": "Life Sciences & Healthcare",
        "keywords": {
            "biology", "life sciences", "healthcare", "medicine", "biotechnology",
            "biomedical", "bioinformatics", "pharmacy", "ichthyology", "genetics",
            "immunology", "ecology", "zoology", "botany", "clinical", "health"
        },
        "branches": [
            "biotechnology", "bioinformatics", "biomedical engineering",
            "pharmacy", "biology", "microbiology", "life sciences"
        ]
    },
    "environmental_sustainability": {
        "id": "environmental_sustainability",
        "name": "Environmental Studies & Sustainability",
        "keywords": {
            "environment", "sustainability", "climate", "ecology", "clean energy",
            "renewable", "conservation", "water", "forestry", "sustainable development",
            "switzer", "earth science", "green tech"
        },
        "branches": [
            "environmental science", "environmental engineering", "sustainability studies",
            "climate science", "natural resource management"
        ]
    },
    "social_humanities": {
        "id": "social_humanities",
        "name": "Social Sciences & Humanities",
        "keywords": {
            "humanities", "social sciences", "journalism", "media", "communications",
            "press", "literature", "history", "sociology", "political science",
            "philosophy", "languages", "international relations", "public policy"
        },
        "branches": [
            "journalism", "mass communication", "english", "history",
            "sociology", "political science", "public policy", "arts"
        ]
    },
    "civil_community": {
        "id": "civil_community",
        "name": "Civil Rights, Community Development & Public Interest",
        "keywords": {
            "community development", "civil rights", "public interest", "humanitarian",
            "social work", "ngo", "equality", "legal aid", "law", "human rights",
            "advocacy", "youth empowerment", "peace"
        },
        "branches": [
            "law", "social work", "development studies", "public interest", "human rights"
        ]
    },
    "general": {
        "id": "general",
        "name": "General / Open Discipline",
        "keywords": {
            "open to all", "all disciplines", "any discipline", "any branch", "all branches",
            "all students", "general", "interdisciplinary", "university-wide", "undergraduate", "postgraduate"
        },
        "branches": [
            "any", "all", "open", "general", "any branch", "all branches", "open to all"
        ]
    }
}

# Related field overlaps (cross-disciplinary synergy)
RELATED_FIELDS = {
    "cs_it": {"data_ai", "engineering_tech"},
    "data_ai": {"cs_it", "business_management"},
    "engineering_tech": {"cs_it", "environmental_sustainability"},
    "business_management": {"data_ai", "social_humanities"},
    "life_sciences_healthcare": {"environmental_sustainability", "data_ai"},
    "environmental_sustainability": {"life_sciences_healthcare", "civil_community"},
    "social_humanities": {"civil_community", "business_management"},
    "civil_community": {"social_humanities", "environmental_sustainability"}
}

def classify_text_to_fields(text: str, branches: Optional[List[str]] = None) -> Set[str]:
    """
    Classifies opportunity text (title, description, eligibility) and branches into canonical field IDs.
    """
    matched_fields: Set[str] = set()
    clean_text = (text or "").lower()

    # 1. Check branches if provided
    if branches:
        for b in branches:
            b_clean = str(b).strip().lower()
            if any(term in b_clean for term in ("any", "all", "open", "all disciplines", "all branches")):
                matched_fields.add("general")
            for field_id, field_data in TAXONOMY.items():
                if field_id == "general":
                    continue
                for known_branch in field_data["branches"]:
                    if known_branch in b_clean or b_clean in known_branch:
                        matched_fields.add(field_id)

    # 2. Check keywords in text
    for field_id, field_data in TAXONOMY.items():
        if field_id in matched_fields:
            continue
        for kw in field_data["keywords"]:
            if len(kw) <= 3:
                # Word boundary for short acronyms like 'ai', 'ml', 'it', 'cse'
                if re.search(r"\b" + re.escape(kw) + r"\b", clean_text):
                    matched_fields.add(field_id)
                    break
            else:
                if kw in clean_text:
                    matched_fields.add(field_id)
                    break

    # If no specific discipline was triggered or text indicates open admission, default to general
    if not matched_fields or any(t in clean_text for t in ("open to all", "all academic disciplines", "any discipline")):
        matched_fields.add("general")

    return matched_fields

def extract_student_fields_of_study(profile: Dict[str, Any]) -> Set[str]:
    """
    Extracts student's primary academic fields from degree, branch, and interests.
    """
    fields: Set[str] = set()
    edu = profile.get("education") or {}
    branch = str(edu.get("branch") or profile.get("branch") or "").lower().strip()
    degree = str(edu.get("degree") or profile.get("degree") or "").lower().strip()
    interests = profile.get("interests") or []
    interests_text = " ".join(interests).lower() if isinstance(interests, list) else ""

    combined_text = f"{branch} {degree} {interests_text}"

    # Check each taxonomy branch and keyword
    for field_id, field_data in TAXONOMY.items():
        if field_id == "general":
            continue
        for known_b in field_data["branches"]:
            if known_b in branch or (len(known_b) > 4 and known_b in combined_text):
                fields.add(field_id)
                break
        if field_id not in fields:
            for kw in field_data["keywords"]:
                if len(kw) <= 3:
                    if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
                        fields.add(field_id)
                        break
                else:
                    if kw in combined_text:
                        fields.add(field_id)
                        break

    # Default to CS/IT for tech students if empty
    if not fields:
        fields.add("cs_it")

    return fields

def compute_field_relevance(student_fields: Set[str], opp_fields: Set[str]) -> Tuple[int, Optional[str]]:
    """
    Computes field-of-study match score (0 to 100) and highlight reason.
    Rules:
      - Direct discipline match: 95-100
      - General / Open-discipline opportunity: 85 (neutral positive for all students)
      - Related cross-disciplinary field (e.g. Data Science <-> Computer Science): 80
      - Unrelated discipline (e.g. Ichthyology for CS student): 40
    """
    # 1. Direct match
    direct_overlap = student_fields.intersection(opp_fields - {"general"})
    if direct_overlap:
        field_id = list(direct_overlap)[0]
        field_name = TAXONOMY[field_id]["name"]
        return 95, f"Directly aligns with your field of study: {field_name}"

    # 2. General / Open discipline
    if "general" in opp_fields:
        return 85, "Open to students across all university academic disciplines"

    # 3. Cross-disciplinary synergy
    for s_field in student_fields:
        related = RELATED_FIELDS.get(s_field, set())
        cross_overlap = related.intersection(opp_fields)
        if cross_overlap:
            c_field = list(cross_overlap)[0]
            c_name = TAXONOMY[c_field]["name"]
            return 80, f"Cross-disciplinary fit for your background ({c_name})"

    # 4. Unrelated discipline
    opp_primary = list(opp_fields)[0] if opp_fields else "another field"
    opp_name = TAXONOMY.get(opp_primary, {}).get("name", "another discipline")
    return 40, f"Focuses primarily on {opp_name}"
