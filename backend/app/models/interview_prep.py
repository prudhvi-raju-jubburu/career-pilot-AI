import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.config.db import Database

logger = logging.getLogger(__name__)

class InterviewPrepModel:
    """
    MongoDB model for personalized interview preparation packs and interactive checklists.
    Stored in the 'interview_prep_packs' collection.
    """
    COLLECTION_NAME = "interview_prep_packs"

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db[cls.COLLECTION_NAME]

    @classmethod
    def ensure_indexes(cls):
        try:
            col = cls.get_collection()
            col.create_index([("user_id", 1), ("application_id", 1)], unique=True)
            col.create_index("user_id")
            col.create_index("application_id")
            logger.info("Successfully ensured MongoDB indexes on '%s'", cls.COLLECTION_NAME)
        except Exception as e:
            logger.warning("Could not create indexes on '%s': %s", cls.COLLECTION_NAME, str(e))

    @classmethod
    def to_dict(cls, doc: Optional[dict]) -> dict:
        if not doc:
            return {}
        data = dict(doc)
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]
        data["checklist"] = data.get("checklist") or []
        data["role_questions"] = data.get("role_questions") or []
        data["project_questions"] = data.get("project_questions") or []
        data["behavioral_questions"] = data.get("behavioral_questions") or []
        data["technical_topics"] = data.get("technical_topics") or []
        data["fundamentals_to_revise"] = data.get("fundamentals_to_revise") or []
        data["questions_for_interviewer"] = data.get("questions_for_interviewer") or []
        data["preparation_schedule"] = data.get("preparation_schedule") or []
        data["practice_tasks"] = data.get("practice_tasks") or []
        data["skill_gaps"] = data.get("skill_gaps") or {
            "role_title": data.get("role_title", "Candidate Role"),
            "company_name": data.get("company_name", "Target Company"),
            "job_description_status": "missing",
            "skill_coverage": 100,
            "total_requirements": 0,
            "summary": {
                "total_requirements": 0,
                "demonstrated_count": 0,
                "listed_count": 0,
                "priority_gap_count": 0,
                "preferred_count": 0,
                "unknown_count": 0,
                "skill_coverage": 100
            },
            "demonstrated": [],
            "listed": [],
            "priority_gaps": [],
            "preferred": [],
            "unknown": [],
            "all_requirements": []
        }
        data["question_bank"] = data.get("question_bank") or []
        data["questions_by_category"] = data.get("questions_by_category") or {}
        data["learning_resources"] = data.get("learning_resources") or []
        return data

    @classmethod
    def find_by_application(cls, app_id: str, user_id: str) -> Optional[dict]:
        col = cls.get_collection()
        doc = col.find_one({
            "application_id": str(app_id),
            "user_id": str(user_id)
        })
        return cls.to_dict(doc) if doc else None

    @classmethod
    def save_prep_pack(cls, user_id: str, app_id: str, prep_data: Dict[str, Any]) -> dict:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()

        doc = dict(prep_data)
        doc["user_id"] = str(user_id)
        doc["application_id"] = str(app_id)
        doc["updated_at"] = now

        # Retain existing checklist completion state and custom roadmap tasks if re-generating
        existing = col.find_one({"application_id": str(app_id), "user_id": str(user_id)})
        if existing and existing.get("checklist") and doc.get("checklist"):
            completed_ids = {c["id"] for c in existing["checklist"] if c.get("completed")}
            existing_task_ids = {item.get("id") for item in doc["checklist"]}
            for item in doc["checklist"]:
                if item.get("id") in completed_ids:
                    item["completed"] = True
            # Retain any skill roadmap tasks added previously
            for c in existing["checklist"]:
                if c.get("id") not in existing_task_ids and c.get("category") == "Skill Gap":
                    doc["checklist"].append(c)

        if not existing:
            doc["created_at"] = now

        col.update_one(
            {"application_id": str(app_id), "user_id": str(user_id)},
            {"$set": doc},
            upsert=True
        )

        saved = col.find_one({"application_id": str(app_id), "user_id": str(user_id)})
        return cls.to_dict(saved)

    @classmethod
    def toggle_checklist_item(cls, app_id: str, user_id: str, task_id: str, completed: bool) -> Optional[dict]:
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()

        doc = col.find_one({"application_id": str(app_id), "user_id": str(user_id)})
        if not doc:
            return None

        checklist = list(doc.get("checklist") or [])
        found = False
        for item in checklist:
            if item.get("id") == task_id:
                item["completed"] = bool(completed)
                found = True
                break

        if not found:
            return cls.to_dict(doc)

        col.update_one(
            {"_id": doc["_id"]},
            {"$set": {"checklist": checklist, "updated_at": now}}
        )
        doc["checklist"] = checklist
        doc["updated_at"] = now
        return cls.to_dict(doc)

    @classmethod
    def add_skill_to_roadmap(cls, app_id: str, user_id: str, skill_name: str) -> Optional[dict]:
        """Adds a specific skill learning milestone to the prep pack checklist and marks it in roadmap."""
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()

        doc = col.find_one({"application_id": str(app_id), "user_id": str(user_id)})
        if not doc:
            return None

        clean_skill = str(skill_name).strip()
        task_id = f"task_skill_{clean_skill.lower().replace(' ', '_').replace('.', '_').replace('/', '_')}"
        checklist = list(doc.get("checklist") or [])

        # Check if already in checklist
        existing_task = next((t for t in checklist if t.get("id") == task_id or clean_skill.lower() == str(t.get("skill_name", "")).lower()), None)
        if not existing_task:
            checklist.append({
                "id": task_id,
                "task": f"Learn {clean_skill}: Review official documentation, core architectural patterns, and build a hands-on project.",
                "category": "Skill Gap",
                "completed": False,
                "skill_name": clean_skill
            })

        # Update in_roadmap in skill_gaps if present
        skill_gaps = doc.get("skill_gaps") or {}
        if isinstance(skill_gaps, dict):
            for group in ["priority_gaps", "preferred", "unknown", "all_requirements", "demonstrated", "listed"]:
                items = skill_gaps.get(group)
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict) and item.get("skill_name", "").lower() == clean_skill.lower():
                            item["in_roadmap"] = True

        col.update_one(
            {"_id": doc["_id"]},
            {"$set": {"checklist": checklist, "skill_gaps": skill_gaps, "updated_at": now}}
        )
        doc["checklist"] = checklist
        doc["skill_gaps"] = skill_gaps
        doc["updated_at"] = now
        return cls.to_dict(doc)

