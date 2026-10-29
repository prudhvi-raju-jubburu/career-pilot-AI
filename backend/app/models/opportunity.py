import logging
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

class OpportunityModel:
    """
    MongoDB data model for canonical career opportunities.
    Manages collection queries, indexes, and JSON serialization.
    """

    COLLECTION_NAME = "opportunities"

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db[cls.COLLECTION_NAME]

    @classmethod
    def ensure_indexes(cls):
        """Creates optimized indexes for fast opportunity search, filtering, sorting, and deduplication."""
        try:
            col = cls.get_collection()
            # 1. Unique deduplication & identity indexes
            col.create_index("metadata.raw_hash", unique=True, sparse=True)
            col.create_index([("source.name", 1), ("source.external_id", 1)], sparse=True)
            col.create_index("application_url", sparse=True)

            # 2. Filtering & query indexes
            col.create_index("status")
            col.create_index("type")
            col.create_index("category")
            col.create_index("dates.deadline")
            col.create_index("created_at")
            col.create_index("organization.name")
            col.create_index("skills")
            col.create_index("location.city")
            col.create_index("location.is_remote")
            col.create_index("work_mode")

            # 3. Compound query indexes
            col.create_index([("status", 1), ("dates.deadline", 1)])
            col.create_index([("status", 1), ("created_at", -1)])
            col.create_index([("status", 1), ("dates.posted_at", -1)])
            col.create_index([("type", 1), ("status", 1)])

            logger.info("Successfully ensured MongoDB indexes on '%s'", cls.COLLECTION_NAME)
        except Exception as e:
            logger.warning("Could not create indexes on '%s': %s", cls.COLLECTION_NAME, str(e))

    @classmethod
    def find_by_id(cls, opp_id: str) -> Optional[dict]:
        """Finds opportunity by ObjectId string or raw string ID."""
        if not opp_id:
            return None
        col = cls.get_collection()
        try:
            if ObjectId.is_valid(opp_id):
                doc = col.find_one({"_id": ObjectId(opp_id)})
                if doc:
                    return doc
            return col.find_one({"_id": opp_id})
        except Exception as e:
            logger.warning("Error finding opportunity by ID %s: %s", opp_id, str(e))
            return None

    @classmethod
    def to_dict(cls, doc: Optional[dict]) -> dict:
        """
        Converts MongoDB document to JSON-safe dictionary.
        Attaches compatibility properties for educational frontend components.
        """
        if not doc:
            return {}

        data = dict(doc)
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]

        org = data.get("organization") or {}
        dates = data.get("dates") or {}
        loc = data.get("location") or {}
        edu = data.get("education_requirements") or {}

        # Attach backward-compatible aliases for existing UI components
        data["company"] = org.get("name", "Unknown Organization")
        data["companyLogo"] = org.get("logo") or org.get("website")
        data["workMode"] = data.get("work_mode", "Onsite")
        data["deadline"] = dates.get("deadline")
        data["postedAt"] = dates.get("posted_at")
        raw_app_url = str(data.get("application_url", "")).strip()
        data["applicationUrl"] = raw_app_url if raw_app_url.lower().startswith(("http://", "https://")) else ""
        data["requirements"] = edu.get("branches") or []
        data["eligibilityText"] = data.get("eligibility_text", "")

        # Format human-friendly location string
        if isinstance(loc, dict):
            city = loc.get("city")
            state = loc.get("state")
            country = loc.get("country")
            is_remote = loc.get("is_remote", False)

            if is_remote:
                if city and "india" in city.lower():
                    data["locationString"] = "Remote (India)"
                elif country == "India":
                    data["locationString"] = "Remote (India)"
                else:
                    data["locationString"] = "Remote (India Eligible)"
            else:
                parts = []
                if city:
                    parts.append(city)
                if state and state != city:
                    parts.append(state)
                if country:
                    parts.append(country)
                data["locationString"] = ", ".join(parts) if parts else "India"
        else:
            data["locationString"] = str(loc) if loc else "India"

        # Format human-friendly deadline string
        deadline_raw = dates.get("deadline")
        if deadline_raw:
            data["deadlineString"] = str(deadline_raw)
        else:
            data["deadlineString"] = "Deadline not specified"

        # Format human-friendly compensation string with explicit semantics
        comp = data.get("compensation") or {}
        opp_type = str(data.get("type", "")).lower()
        if isinstance(comp, dict) and (comp.get("min_amount") or comp.get("min") or comp.get("max_amount") or comp.get("max")):
            c_curr = "₹" if comp.get("currency") in ("INR", "₹", None) else ("$" if comp.get("currency") == "USD" else str(comp.get("currency", "₹")))
            c_min = comp.get("min_amount") or comp.get("min")
            c_max = comp.get("max_amount") or comp.get("max")
            
            if opp_type == "scholarship":
                c_period = " award"
            elif comp.get("type") == "stipend" or comp.get("period") == "month":
                c_period = "/mo"
            elif comp.get("period") == "year" or comp.get("type") == "salary":
                c_period = "/yr"
            else:
                c_period = ""
            
            if c_min and c_max:
                if c_min == c_max:
                    data["compensationString"] = f"{c_curr}{c_min:,}{c_period}"
                else:
                    data["compensationString"] = f"{c_curr}{c_min:,} – {c_curr}{c_max:,}{c_period}"
            elif c_min:
                data["compensationString"] = f"{c_curr}{c_min:,}+{c_period}"
            elif c_max:
                data["compensationString"] = f"Up to {c_curr}{c_max:,}{c_period}"
            else:
                data["compensationString"] = "Not specified"
        elif isinstance(comp, dict) and comp.get("type") == "unpaid":
            data["compensationString"] = "Unpaid"
        else:
            data["compensationString"] = "Not specified"

        return data
