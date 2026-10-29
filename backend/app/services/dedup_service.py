import re
import difflib
import logging
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime, timezone
from app.models.opportunity import OpportunityModel

logger = logging.getLogger(__name__)

class DeduplicationService:
    """
    Production cross-source deduplication service.
    Detects duplicate opportunities across external job boards, ATS feeds,
    and user imports using deterministic hashes and token-level fuzzy matching.
    Merges duplicate listings into one canonical record with multiple application links.
    """

    @classmethod
    def find_duplicate(cls, new_opp: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Searches MongoDB for existing opportunity matching the new opportunity.
        Returns the existing document if duplicate, else None.
        """
        col = OpportunityModel.get_collection()

        # 1. Exact raw_hash match
        raw_hash = new_opp.get("metadata", {}).get("raw_hash")
        if raw_hash:
            doc = col.find_one({"metadata.raw_hash": raw_hash})
            if doc:
                return doc

        # 2. Source external_id match
        source = new_opp.get("source") or {}
        s_name = source.get("name")
        ext_id = source.get("external_id")
        if s_name and ext_id:
            doc = col.find_one({"source.name": s_name, "source.external_id": ext_id})
            if doc:
                return doc

        # 3. Fuzzy match: same organization + highly similar title + same location
        org_name = (new_opp.get("organization") or {}).get("name", "")
        title = new_opp.get("title", "")
        city = (new_opp.get("location") or {}).get("city", "")

        if org_name and title:
            # Query active opportunities with the same organization (case-insensitive regex)
            candidates = list(col.find({
                "organization.name": {"$regex": f"^{re.escape(org_name.strip())}$", "$options": "i"},
                "status": {"$in": ["active", "open"]}
            }).limit(20))

            for cand in candidates:
                cand_title = cand.get("title", "")
                similarity = cls._compute_title_similarity(title, cand_title)
                if similarity >= 0.88:
                    # Check location alignment
                    cand_city = (cand.get("location") or {}).get("city", "")
                    if not city or not cand_city or city.lower() in cand_city.lower() or cand_city.lower() in city.lower():
                        return cand

        return None

    @classmethod
    def merge_into_canonical(cls, canonical_doc: Dict[str, Any], incoming_opp: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merges an incoming duplicate into the canonical record.
        Maintains source links and updates freshness.
        """
        col = OpportunityModel.get_collection()
        doc_id = canonical_doc.get("_id")
        now = datetime.now(timezone.utc).isoformat()

        # Collect source links
        existing_sources = canonical_doc.get("source_links") or [
            {"name": canonical_doc.get("source", {}).get("name", "original"), "url": canonical_doc.get("application_url")}
        ]

        incoming_source = incoming_opp.get("source") or {}
        incoming_link = {
            "name": incoming_source.get("name", "external"),
            "url": incoming_opp.get("application_url"),
            "added_at": now
        }

        # Add if not already present
        if not any(s.get("url") == incoming_link["url"] for s in existing_sources if s.get("url")):
            existing_sources.append(incoming_link)

        # Merge skills (union)
        existing_skills = set(canonical_doc.get("skills") or [])
        incoming_skills = set(incoming_opp.get("skills") or [])
        merged_skills = sorted(list(existing_skills.union(incoming_skills)))

        # Update in database
        col.update_one(
            {"_id": doc_id},
            {
                "$set": {
                    "source_links": existing_sources,
                    "skills": merged_skills,
                    "updated_at": now
                }
            }
        )
        canonical_doc["source_links"] = existing_sources
        canonical_doc["skills"] = merged_skills
        return canonical_doc

    @staticmethod
    def _compute_title_similarity(t1: str, t2: str) -> float:
        """Token sort ratio similarity between two role titles."""
        clean1 = re.sub(r'[^a-z0-9 ]', '', t1.lower()).strip()
        clean2 = re.sub(r'[^a-z0-9 ]', '', t2.lower()).strip()
        if clean1 == clean2:
            return 1.0

        matcher = difflib.SequenceMatcher(None, clean1, clean2)
        return matcher.ratio()
