import re
import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from bson import ObjectId

from app.models.opportunity import OpportunityModel
from app.utils.opportunity_normalizer import (
    normalize_opportunity_type,
    normalize_category,
    normalize_work_mode,
    normalize_location,
    parse_iso_deadline,
    extract_skills_from_text,
    generate_dedupe_key,
    CANONICAL_TYPES,
    CANONICAL_CATEGORIES
)
from app.utils.skill_normalizer import normalize_skill_list

logger = logging.getLogger(__name__)

class OpportunityService:
    """
    Core production service for opportunity ingestion, normalization, validation,
    deterministic deduplication, indexing, expiration, and paginated discovery queries.
    """

    @classmethod
    def validate_opportunity(cls, opp: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Validates opportunity quality before persistence.
        Guarantees minimum data integrity and rejects malformed documents.
        """
        if not isinstance(opp, dict):
            return False, "Opportunity payload must be a JSON dictionary."

        # 1. Title validation
        title = opp.get("title")
        if not title or not isinstance(title, str) or len(title.strip()) < 3:
            return False, "Opportunity title must be at least 3 characters long."
        if len(title.strip()) > 250:
            return False, "Opportunity title exceeds maximum length of 250 characters."

        # 2. Organization validation
        org = opp.get("organization") or {}
        org_name = org.get("name") if isinstance(org, dict) else opp.get("organization_name")
        if not org_name or not isinstance(org_name, str) or len(org_name.strip()) < 2:
            return False, "Opportunity organization name must be at least 2 characters long."

        # 3. Application or source URL validation
        app_url = opp.get("application_url") or opp.get("source", {}).get("url")
        if not app_url or not isinstance(app_url, str):
            return False, "Opportunity must have an application URL or source URL."
        if not re.match(r"^https?://[^\s/$.?#].[^\s]*$", app_url.strip(), re.IGNORECASE):
            return False, "Provided application URL is not a valid HTTP/HTTPS URL."

        # 4. Type validation
        opp_type = opp.get("type", "other")
        if opp_type not in CANONICAL_TYPES:
            return False, f"Opportunity type '{opp_type}' is not recognized."

        # 5. Category validation
        category = opp.get("category", "general")
        if category not in CANONICAL_CATEGORIES:
            return False, f"Opportunity category '{category}' is not recognized."

        # 6. CGPA requirements validation
        edu = opp.get("education_requirements") or {}
        if isinstance(edu, dict):
            cgpa = edu.get("cgpa_min")
            if cgpa is not None and cgpa != "":
                try:
                    num_cgpa = float(cgpa)
                    if num_cgpa < 0.0 or num_cgpa > 10.0:
                        return False, "Minimum CGPA requirement must be between 0.0 and 10.0."
                except (ValueError, TypeError):
                    return False, "Minimum CGPA requirement must be a valid number."

        return True, None

    @classmethod
    def normalize_opportunity(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms raw opportunity attributes into the canonical CareerPilot schema.
        Handles text cleaning, skill normalization, deadline parsing, and dedupe hash generation.
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        # Title and organization
        title = str(raw.get("title", "")).strip()
        org_raw = raw.get("organization") or {}
        if isinstance(org_raw, dict):
            org_name = str(org_raw.get("name", "")).strip()
            org_website = org_raw.get("website")
        else:
            org_name = str(raw.get("organization_name", "")).strip()
            org_website = raw.get("organization_website")

        description = str(raw.get("description", "")).strip()

        # Type & category
        opp_type = normalize_opportunity_type(raw.get("type"))
        category = normalize_category(raw.get("category"), title=title, description=description)

        # Location & work mode
        location_data = normalize_location(raw.get("location"))
        is_remote = location_data.get("is_remote", False) or raw.get("work_mode", "").lower() == "remote"
        work_mode = normalize_work_mode(raw.get("work_mode"), is_remote=is_remote)
        location_data["is_remote"] = (work_mode == "Remote")

        # Skills extraction & canonical normalization
        explicit_skills = raw.get("skills", [])
        if isinstance(explicit_skills, list):
            raw_skills = [str(s) for s in explicit_skills if str(s).strip()]
        else:
            raw_skills = []
        skills = extract_skills_from_text(f"{title} {description}", existing_skills=raw_skills)

        # Dates & deadline
        dates_raw = raw.get("dates") or {}
        if isinstance(dates_raw, dict):
            deadline_input = dates_raw.get("deadline", raw.get("deadline"))
            posted_input = dates_raw.get("posted_at", raw.get("posted_at"))
        else:
            deadline_input = raw.get("deadline")
            posted_input = raw.get("posted_at")

        deadline_iso = parse_iso_deadline(deadline_input)
        posted_iso = parse_iso_deadline(posted_input) or now_iso

        # Education & Experience requirements
        edu_req = raw.get("education_requirements") or {}
        exp_req = raw.get("experience") or {}
        cgpa_val = edu_req.get("cgpa_min")
        if cgpa_val is not None and cgpa_val != "":
            try:
                cgpa_val = float(cgpa_val)
            except (ValueError, TypeError):
                cgpa_val = None

        education_requirements = {
            "degrees": edu_req.get("degrees", []),
            "branches": edu_req.get("branches", []),
            "graduation_years": [int(y) for y in edu_req.get("graduation_years", []) if str(y).isdigit()],
            "cgpa_min": cgpa_val
        }

        experience = {
            "min_years": exp_req.get("min_years", 0),
            "max_years": exp_req.get("max_years")
        }

        # Application URL & Source
        app_url = (raw.get("application_url") or raw.get("source", {}).get("url") or "").strip()
        source_raw = raw.get("source") or {}
        source_name = source_raw.get("name") or "careerpilot_curated"
        external_id = source_raw.get("external_id") or raw.get("external_id")

        source = {
            "name": str(source_name).strip(),
            "url": str(source_raw.get("url") or app_url).strip(),
            "external_id": str(external_id).strip() if external_id else None
        }

        # Compensation
        comp_raw = raw.get("compensation") or {}
        compensation = {
            "type": comp_raw.get("type"),
            "min": comp_raw.get("min"),
            "max": comp_raw.get("max"),
            "currency": comp_raw.get("currency", "INR")
        }

        # Status: check if deadline is in the past
        status = raw.get("status", "active")
        if deadline_iso:
            now_utc = datetime.now(timezone.utc).isoformat()
            if deadline_iso < now_utc:
                status = "expired"

        # Generate deterministic dedupe key
        dedupe_key = generate_dedupe_key(
            source_name=source["name"],
            external_id=source["external_id"],
            org_name=org_name,
            title=title,
            application_url=app_url,
            location_city=location_data.get("city"),
            deadline=deadline_iso
        )

        return {
            "title": title,
            "organization": {
                "name": org_name,
                "website": org_website
            },
            "description": description,
            "type": opp_type,
            "category": category,
            "location": location_data,
            "work_mode": work_mode,
            "skills": skills,
            "education_requirements": education_requirements,
            "experience": experience,
            "eligibility_text": str(raw.get("eligibility_text", "")).strip(),
            "application_url": app_url,
            "source": source,
            "dates": {
                "posted_at": posted_iso,
                "deadline": deadline_iso
            },
            "compensation": compensation,
            "status": status,
            "metadata": {
                "tags": raw.get("metadata", {}).get("tags", []),
                "raw_hash": dedupe_key
            }
        }

    @classmethod
    def upsert_opportunity(cls, opp_data: Dict[str, Any]) -> Tuple[Dict[str, Any], bool]:
        """
        Deduplicates and upserts an opportunity document in MongoDB.
        Preserves original _id and created_at timestamps on duplicate matches.
        """
        normalized = cls.normalize_opportunity(opp_data)
        is_valid, error = cls.validate_opportunity(normalized)
        if not is_valid:
            raise ValueError(f"Invalid opportunity: {error}")

        col = OpportunityModel.get_collection()
        dedupe_hash = normalized["metadata"]["raw_hash"]
        now = datetime.now(timezone.utc).isoformat()

        existing = col.find_one({"metadata.raw_hash": dedupe_hash})
        if existing:
            # Preserve created_at and internal _id
            update_payload = {
                "title": normalized["title"],
                "organization": normalized["organization"],
                "description": normalized["description"],
                "type": normalized["type"],
                "category": normalized["category"],
                "location": normalized["location"],
                "work_mode": normalized["work_mode"],
                "skills": normalized["skills"],
                "education_requirements": normalized["education_requirements"],
                "experience": normalized["experience"],
                "eligibility_text": normalized["eligibility_text"],
                "application_url": normalized["application_url"],
                "source": normalized["source"],
                "dates": normalized["dates"],
                "compensation": normalized["compensation"],
                "status": normalized["status"],
                "updated_at": now,
                "last_seen_at": now
            }
            col.update_one({"_id": existing["_id"]}, {"$set": update_payload})
            existing.update(update_payload)
            return existing, False
        else:
            normalized["created_at"] = now
            normalized["updated_at"] = now
            normalized["last_seen_at"] = now
            res = col.insert_one(normalized)
            normalized["_id"] = res.inserted_id
            return normalized, True

    @classmethod
    def list_opportunities(
        cls,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        opp_type: Optional[str] = None,
        category: Optional[str] = None,
        location: Optional[str] = None,
        remote: Optional[bool] = None,
        work_mode: Optional[str] = None,
        deadline_before: Optional[str] = None,
        status: str = "active",
        sort_by: str = "latest"
    ) -> Dict[str, Any]:
        """
        Queries opportunities with safe pagination, full-text / field filters, and sorting.
        Enforces maximum limit of 50 to prevent unbounded queries.
        """
        # Validate query parameters
        page = max(1, int(page))
        limit = max(1, min(50, int(limit)))

        query: Dict[str, Any] = {}

        # Default filter: active status
        if status and status != "all":
            query["status"] = status.strip().lower()

        # Type filter
        if opp_type and opp_type.strip().lower() not in ("all", ""):
            canonical_type = normalize_opportunity_type(opp_type)
            query["type"] = canonical_type

        # Category filter
        if category and category.strip().lower() not in ("all", ""):
            query["category"] = category.strip().lower()

        # Work Mode filter
        if work_mode and work_mode.strip().lower() not in ("all", ""):
            query["work_mode"] = normalize_work_mode(work_mode)

        # Remote boolean filter
        if remote is not None:
            if isinstance(remote, str):
                is_remote_val = remote.lower() in ("true", "1", "yes")
            else:
                is_remote_val = bool(remote)
            if is_remote_val:
                query["$or"] = [{"location.is_remote": True}, {"work_mode": "Remote"}]

        # Location filter
        if location and location.strip():
            loc_clean = re.escape(location.strip())
            query["$or"] = [
                {"location.city": {"$regex": loc_clean, "$options": "i"}},
                {"location.state": {"$regex": loc_clean, "$options": "i"}},
                {"location.country": {"$regex": loc_clean, "$options": "i"}}
            ]

        # Deadline filter
        if deadline_before and deadline_before.strip():
            parsed_deadline = parse_iso_deadline(deadline_before)
            if parsed_deadline:
                query["dates.deadline"] = {"$lte": parsed_deadline, "$ne": None}

        # Search query across title, organization name, and skills
        if search and search.strip():
            clean_search = re.escape(search.strip())
            search_clause = [
                {"title": {"$regex": clean_search, "$options": "i"}},
                {"organization.name": {"$regex": clean_search, "$options": "i"}},
                {"skills": {"$regex": clean_search, "$options": "i"}}
            ]
            if "$or" in query:
                query["$and"] = [{"$or": query.pop("$or")}, {"$or": search_clause}]
            else:
                query["$or"] = search_clause

        col = OpportunityModel.get_collection()

        # Sorting logic
        if sort_by == "deadline":
            sort_criteria = [("dates.deadline", 1), ("created_at", -1)]
        else:  # default "latest"
            sort_criteria = [("created_at", -1)]

        total_count = col.count_documents(query)
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
        skip = (page - 1) * limit

        cursor = col.find(query).sort(sort_criteria).skip(skip).limit(limit)
        items = [OpportunityModel.to_dict(doc) for doc in cursor]

        return {
            "items": items,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": total_pages
            }
        }

    @classmethod
    def get_opportunity_by_id(cls, opp_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves and serializes a single opportunity by ID."""
        doc = OpportunityModel.find_by_id(opp_id)
        if not doc:
            return None
        return OpportunityModel.to_dict(doc)

    @classmethod
    def get_categories(cls) -> List[Dict[str, Any]]:
        """Returns list of categories with current opportunity counts."""
        col = OpportunityModel.get_collection()
        pipeline = [
            {"$match": {"status": "active"}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        results = list(col.aggregate(pipeline))
        return [{"category": r["_id"] or "general", "count": r["count"]} for r in results]

    @classmethod
    def get_filter_options(cls) -> Dict[str, Any]:
        """Provides available filter choices dynamically based on database contents."""
        col = OpportunityModel.get_collection()
        types = col.distinct("type", {"status": "active"})
        categories = col.distinct("category", {"status": "active"})
        cities = col.distinct("location.city", {"status": "active"})
        work_modes = col.distinct("work_mode", {"status": "active"})

        return {
            "types": sorted([t for t in types if t]),
            "categories": sorted([c for c in categories if c]),
            "locations": sorted([c for c in cities if c]),
            "work_modes": sorted([w for w in work_modes if w])
        }

    @classmethod
    def expire_past_opportunities(cls) -> int:
        """
        Background maintenance job to mark opportunities past deadline as 'expired'.
        Returns the number of expired opportunities transitioned.
        """
        col = OpportunityModel.get_collection()
        now_utc = datetime.now(timezone.utc).isoformat()
        res = col.update_many(
            {
                "status": "active",
                "dates.deadline": {"$ne": None, "$lt": now_utc}
            },
            {
                "$set": {
                    "status": "expired",
                    "updated_at": now_utc
                }
            }
        )
        if res.modified_count > 0:
            logger.info("Marked %d opportunities as expired.", res.modified_count)
        return res.modified_count
