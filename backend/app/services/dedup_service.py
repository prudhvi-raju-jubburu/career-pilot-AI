import re
import difflib
import logging
from typing import Dict, Any, Optional, Tuple, List, Set
from datetime import datetime, timezone
from app.models.opportunity import OpportunityModel
from app.utils.opportunity_normalizer import canonicalize_url, normalize_opportunity_type

logger = logging.getLogger(__name__)

SENIORITY_TOKENS = {
    "intern", "internship", "trainee", "fresher", "junior", "associate",
    "senior", "lead", "principal", "staff", "architect", "director", "manager"
}

ROLE_DISCIPLINE_TOKENS = {
    "frontend", "backend", "fullstack", "full stack", "devops", "cloud",
    "qa", "testing", "security", "data", "ml", "ai", "mobile", "android", "ios"
}

ORG_SUFFIX_REGEX = re.compile(
    r'\b(inc\.?|llc\.?|ltd\.?|pvt\.?|private\s+limited|technologies|tech|solutions|corporation|corp\.?|india\s+pvt\s+ltd|services)\b',
    re.IGNORECASE
)

class DeduplicationService:
    """
    Centralized, production-grade deduplication and record merging engine.
    Detects duplicate opportunities across external job boards, ATS feeds, and direct imports
    using layered matching:
      Layer 1: Stable source identity (source name + external opportunity ID)
      Layer 2: Exact raw_hash match
      Layer 3: Canonical application/opportunity URL match
      Layer 4: Exact normalized cross-source identity (organization + title + location + type)
      Layer 5: Conservative multi-signal fuzzy matching (org + title + seniority + location + type)
    
    When a genuine duplicate is identified, updates the canonical record using deterministic
    field-precedence rules rather than discarding legitimate data.
    """

    @classmethod
    def normalize_title(cls, title: Optional[str]) -> str:
        """Normalizes job/opportunity title for stable comparison."""
        if not title or not isinstance(title, str):
            return ""
        clean = title.lower().strip()
        # Collapse Roman numerals / numbers (sde 1 -> sde i, sde 2 -> sde ii)
        clean = re.sub(r'\b(sde|swe|engineer)\s*[-_]?\s*1\b', r'\1 i', clean)
        clean = re.sub(r'\b(sde|swe|engineer)\s*[-_]?\s*2\b', r'\1 ii', clean)
        clean = re.sub(r'\b(sde|swe|engineer)\s*[-_]?\s*3\b', r'\1 iii', clean)
        # Strip special punctuation and collapse multiple spaces
        clean = re.sub(r'[^a-z0-9\s]', ' ', clean)
        return re.sub(r'\s+', ' ', clean).strip()

    @classmethod
    def normalize_org_name(cls, org_name: Optional[str]) -> str:
        """Normalizes company/organization name, removing common corporate suffixes."""
        if not org_name or not isinstance(org_name, str):
            return ""
        clean = org_name.lower().strip()
        clean = ORG_SUFFIX_REGEX.sub('', clean)
        clean = re.sub(r'[^a-z0-9\s]', ' ', clean)
        return re.sub(r'\s+', ' ', clean).strip()

    @classmethod
    def normalize_location_token(cls, loc: Any) -> str:
        """Standardizes location into a comparable token without treating different cities as identical."""
        if not loc:
            return ""
        if isinstance(loc, dict):
            city = str(loc.get("city") or "").strip().lower()
            if loc.get("is_remote"):
                return "remote"
            return re.sub(r'[^a-z0-9]', '', city)
        city_str = str(loc).strip().lower()
        if "remote" in city_str or "virtual" in city_str or "work from home" in city_str:
            return "remote"
        return re.sub(r'[^a-z0-9]', '', city_str)

    @classmethod
    def find_duplicate(cls, new_opp: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """
        Searches MongoDB for existing opportunity matching the incoming opportunity.
        Returns (existing_doc, match_reason) if found, else (None, None).
        
        Match reasons:
          - 'stable_source_id'
          - 'raw_hash'
          - 'canonical_url'
          - 'cross_source_exact'
          - 'conservative_fuzzy'
        """
        col = OpportunityModel.get_collection()

        # -------------------------------------------------------------
        # Layer 1: Stable source identity (source name + external opportunity ID)
        # -------------------------------------------------------------
        source = new_opp.get("source") or {}
        s_name = str(source.get("name") or "").strip()
        ext_id = str(source.get("external_id") or "").strip()
        if s_name and ext_id:
            doc = col.find_one({"source.name": s_name, "source.external_id": ext_id})
            if doc:
                return doc, "stable_source_id"

        # -------------------------------------------------------------
        # Layer 2: Exact raw_hash match
        # -------------------------------------------------------------
        raw_hash = new_opp.get("metadata", {}).get("raw_hash")
        if raw_hash:
            doc = col.find_one({"metadata.raw_hash": raw_hash})
            if doc:
                return doc, "raw_hash"

        # -------------------------------------------------------------
        # Layer 3: Canonical application URL match
        # -------------------------------------------------------------
        raw_app_url = new_opp.get("application_url") or source.get("url")
        canonical_app_url = canonicalize_url(raw_app_url)
        if canonical_app_url and len(canonical_app_url) > 12:
            # Query by exact match on canonical URL in application_url, source.url, or source_links.url
            doc = col.find_one({
                "$or": [
                    {"application_url": raw_app_url},
                    {"application_url": canonical_app_url},
                    {"source.url": canonical_app_url},
                    {"source_links.url": canonical_app_url}
                ]
            })
            if doc:
                return doc, "canonical_url"

        # -------------------------------------------------------------
        # Layer 4: Cross-source exact matching (org + title + location + type)
        # -------------------------------------------------------------
        raw_org = (new_opp.get("organization") or {}).get("name", "")
        raw_title = new_opp.get("title", "")
        norm_org = cls.normalize_org_name(raw_org)
        norm_title = cls.normalize_title(raw_title)
        norm_loc = cls.normalize_location_token(new_opp.get("location"))
        opp_type = normalize_opportunity_type(new_opp.get("type"))

        if norm_org and norm_title:
            # Find active opportunities by exact or regex matching company name
            candidates = list(col.find({
                "organization.name": {"$regex": f"^{re.escape(raw_org.strip())}$", "$options": "i"},
                "status": {"$in": ["active", "open"]}
            }).limit(25))

            for cand in candidates:
                cand_title = cand.get("title", "")
                cand_norm_title = cls.normalize_title(cand_title)
                cand_loc = cls.normalize_location_token(cand.get("location"))
                cand_type = normalize_opportunity_type(cand.get("type"))

                # Safeguard: if both have external IDs from the same source and they differ, NOT a duplicate
                cand_src = cand.get("source") or {}
                cand_s_name = str(cand_src.get("name") or "").strip()
                cand_ext_id = str(cand_src.get("external_id") or "").strip()
                if s_name and ext_id and cand_s_name == s_name and cand_ext_id and cand_ext_id != ext_id:
                    continue

                # Exact normalized title match
                if cand_norm_title == norm_title and cand_type == opp_type:
                    # Check location alignment
                    if not norm_loc or not cand_loc or norm_loc == "remote" or cand_loc == "remote" or norm_loc == cand_loc:
                        return cand, "cross_source_exact"

            # -------------------------------------------------------------
            # Layer 5: Conservative multi-signal fuzzy matching
            # -------------------------------------------------------------
            for cand in candidates:
                cand_title = cand.get("title", "")
                cand_norm_title = cls.normalize_title(cand_title)
                cand_loc = cls.normalize_location_token(cand.get("location"))
                cand_type = normalize_opportunity_type(cand.get("type"))

                # Check external ID conflict
                cand_src = cand.get("source") or {}
                cand_s_name = str(cand_src.get("name") or "").strip()
                cand_ext_id = str(cand_src.get("external_id") or "").strip()
                if s_name and ext_id and cand_s_name == s_name and cand_ext_id and cand_ext_id != ext_id:
                    continue

                # Type mismatch rejects duplicate immediately
                if cand_type != opp_type:
                    continue

                # Seniority check: e.g. "intern" must never match "senior" or "lead"
                if not cls._seniority_compatible(norm_title, cand_norm_title):
                    continue

                # Role discipline check: e.g. "frontend" must never match "backend"
                if not cls._discipline_compatible(norm_title, cand_norm_title):
                    continue

                # Conservative title similarity threshold >= 0.90
                similarity = cls._compute_title_similarity(norm_title, cand_norm_title)
                if similarity >= 0.90:
                    # Multi-signal location verification
                    if not norm_loc or not cand_loc or norm_loc == "remote" or cand_loc == "remote" or norm_loc == cand_loc:
                        return cand, "conservative_fuzzy"

        return None, None

    @classmethod
    def merge_into_canonical(
        cls,
        canonical_doc: Dict[str, Any],
        incoming_opp: Dict[str, Any],
        match_reason: str = "duplicate_match"
    ) -> Dict[str, Any]:
        """
        Merges an incoming duplicate into the canonical opportunity record.
        Rules:
          - Preserves canonical internal _id and created_at.
          - Unions source_links and deduplicates URLs.
          - Unions skills with canonical alias resolution.
          - Updates missing or stale fields using deterministic field-precedence.
          - Never overwrites reliable fields with empty/null/shorter values.
          - Sets last_seen_at and updated_at to current UTC timestamp.
        """
        col = OpportunityModel.get_collection()
        doc_id = canonical_doc.get("_id")
        now = datetime.now(timezone.utc).isoformat()

        # 1. Manage source_links array
        existing_sources = canonical_doc.get("source_links") or []
        if not existing_sources:
            orig_src = canonical_doc.get("source") or {}
            orig_url = canonical_doc.get("application_url") or orig_src.get("url")
            if orig_url:
                existing_sources.append({
                    "name": orig_src.get("name", "canonical_source"),
                    "url": orig_url,
                    "external_id": orig_src.get("external_id"),
                    "added_at": canonical_doc.get("created_at") or now
                })

        incoming_src = incoming_opp.get("source") or {}
        incoming_url = incoming_opp.get("application_url") or incoming_src.get("url")
        canonical_inc_url = canonicalize_url(incoming_url)

        if incoming_url:
            has_url = any(
                canonicalize_url(s.get("url")) == canonical_inc_url
                for s in existing_sources if s.get("url")
            )
            if not has_url:
                existing_sources.append({
                    "name": incoming_src.get("name", "external_source"),
                    "url": incoming_url,
                    "external_id": incoming_src.get("external_id"),
                    "added_at": now
                })

        # 2. Union skills
        existing_skills = set(canonical_doc.get("skills") or [])
        incoming_skills = set(incoming_opp.get("skills") or [])
        merged_skills = sorted(list(existing_skills.union(incoming_skills)))

        # 3. Deterministic field precedence
        update_set: Dict[str, Any] = {
            "source_links": existing_sources,
            "skills": merged_skills,
            "last_seen_at": now,
            "updated_at": now,
            "metadata.last_dedup_reason": match_reason
        }

        # Refresh deadline if incoming provides an active deadline and canonical was empty or expired
        inc_deadline = (incoming_opp.get("dates") or {}).get("deadline") or incoming_opp.get("deadline")
        can_deadline = (canonical_doc.get("dates") or {}).get("deadline") or canonical_doc.get("deadline")
        if inc_deadline and not can_deadline:
            update_set["dates.deadline"] = inc_deadline
            update_set["deadline"] = inc_deadline

        # Refresh description if canonical was brief (< 100 chars) and incoming is richer
        inc_desc = str(incoming_opp.get("description") or "").strip()
        can_desc = str(canonical_doc.get("description") or "").strip()
        if inc_desc and len(inc_desc) > len(can_desc) and len(can_desc) < 100:
            update_set["description"] = inc_desc

        # Refresh compensation if canonical was unspecified and incoming has parsed numbers
        can_comp = canonical_doc.get("compensation") or {}
        inc_comp = incoming_opp.get("compensation") or {}
        if inc_comp.get("min_amount") or inc_comp.get("max_amount"):
            if not can_comp.get("min_amount") and not can_comp.get("max_amount"):
                update_set["compensation"] = inc_comp

        # Re-activate status if was expired but incoming has future deadline
        if canonical_doc.get("status") == "expired" and inc_deadline and inc_deadline > now:
            update_set["status"] = "active"

        col.update_one({"_id": doc_id}, {"$set": update_set})

        # Reflect updates in returned canonical document
        canonical_doc["source_links"] = existing_sources
        canonical_doc["skills"] = merged_skills
        canonical_doc["last_seen_at"] = now
        canonical_doc["updated_at"] = now
        for k, v in update_set.items():
            if "." not in k:
                canonical_doc[k] = v

        return canonical_doc

    @staticmethod
    def _compute_title_similarity(t1: str, t2: str) -> float:
        """Token sort ratio similarity between two normalized titles."""
        if t1 == t2:
            return 1.0
        matcher = difflib.SequenceMatcher(None, t1, t2)
        return matcher.ratio()

    @staticmethod
    def _seniority_compatible(t1: str, t2: str) -> bool:
        """Ensures different seniority levels (e.g. Intern vs Senior/Lead) are never merged."""
        words1 = set(t1.split())
        words2 = set(t2.split())
        s1 = words1.intersection(SENIORITY_TOKENS)
        s2 = words2.intersection(SENIORITY_TOKENS)
        if s1 and s2 and s1 != s2:
            # Different seniority levels detected (e.g. {"intern"} vs {"senior"})
            return False
        return True

    @staticmethod
    def _discipline_compatible(t1: str, t2: str) -> bool:
        """Ensures opposing engineering disciplines (e.g. Frontend vs Backend) are never merged."""
        words1 = set(t1.split())
        words2 = set(t2.split())
        d1 = words1.intersection(ROLE_DISCIPLINE_TOKENS)
        d2 = words2.intersection(ROLE_DISCIPLINE_TOKENS)
        if d1 and d2 and d1 != d2:
            # Opposite disciplines detected
            return False
        return True
