from datetime import datetime, timezone
from bson import ObjectId
from app.config.db import Database

class ProfileModel:
    """Manages student profile persistence, provenance tracking, and completion scoring in MongoDB."""

    @classmethod
    def get_collection(cls):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection is not initialized")
        return db["profiles"]

    @classmethod
    def ensure_indexes(cls):
        """Creates unique index on user_id to ensure 1 profile per student."""
        try:
            col = cls.get_collection()
            col.create_index("user_id", unique=True)
        except Exception:
            pass

    @classmethod
    def find_by_user_id(cls, user_id: str):
        """Finds student profile by user_id string or ObjectId."""
        if not user_id:
            return None
        col = cls.get_collection()
        try:
            obj_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            profile = col.find_one({"user_id": obj_id})
            if not profile:
                # Also check string representation
                profile = col.find_one({"user_id": str(user_id)})
            return profile
        except Exception:
            return col.find_one({"user_id": str(user_id)})

    @staticmethod
    def calculate_completion(profile_doc: dict) -> dict:
        """
        Calculates weighted profile completion percentage and identifies missing items.
        Weighting:
          - Identity (15%)
          - Education (25%)
          - Skills (25%)
          - Resume (15%)
          - Preferences (10%)
          - Projects / Experience (10%)
        """
        if not profile_doc:
            return {"percentage": 0, "breakdown": {}, "missing_items": ["Identity", "Education", "Skills", "Resume", "Preferences"]}

        score = 0
        missing = []
        breakdown = {}

        # 1. Identity (15%)
        personal = profile_doc.get("personal", {})
        has_name = bool(personal.get("fullName", {}).get("value"))
        has_email = bool(personal.get("email", {}).get("value"))
        has_phone = bool(personal.get("phone", {}).get("value"))
        identity_score = 0
        if has_name: identity_score += 7
        if has_email: identity_score += 5
        if has_phone: identity_score += 3
        else: missing.append("Contact Phone Number")
        score += identity_score
        breakdown["identity"] = round((identity_score / 15) * 100)

        # 2. Education (25%)
        edu = profile_doc.get("education", {})
        has_college = bool(edu.get("college", {}).get("value"))
        has_branch = bool(edu.get("branch", {}).get("value"))
        has_grad_year = bool(edu.get("graduationYear", {}).get("value"))
        has_cgpa = bool(edu.get("cgpa", {}).get("value"))
        edu_score = 0
        if has_college: edu_score += 7
        else: missing.append("College Name")
        if has_branch: edu_score += 6
        else: missing.append("Academic Branch")
        if has_grad_year: edu_score += 6
        else: missing.append("Graduation Year")
        if has_cgpa: edu_score += 6
        else: missing.append("CGPA")
        score += edu_score
        breakdown["education"] = round((edu_score / 25) * 100)

        # 3. Skills (25%)
        skills = profile_doc.get("skills", {})
        all_skills = []
        for cat in ["programmingLanguages", "technical", "frameworks", "databases", "cloud", "tools"]:
            cat_skills = skills.get(cat, {}).get("value", [])
            if isinstance(cat_skills, list):
                all_skills.extend(cat_skills)

        skills_count = len(all_skills)
        skills_score = min(25, int((skills_count / 5) * 25))
        if skills_count < 3:
            missing.append("At least 3 Technical Skills")
        score += skills_score
        breakdown["skills"] = round((skills_score / 25) * 100)

        # 4. Resume (15%)
        resume = profile_doc.get("resume", {})
        resume_score = 15 if resume.get("parsed") else (5 if resume.get("filePath") else 0)
        if not resume.get("parsed"):
            missing.append("Parsed Resume")
        score += resume_score
        breakdown["resume"] = round((resume_score / 15) * 100)

        # 5. Preferences (10%)
        prefs = profile_doc.get("preferences", {})
        roles = prefs.get("targetRoles", {}).get("value", [])
        locs = prefs.get("preferredLocations", {}).get("value", [])
        pref_score = 0
        if roles and len(roles) > 0: pref_score += 5
        else: missing.append("Target Job Roles")
        if locs and len(locs) > 0: pref_score += 5
        else: missing.append("Preferred Locations")
        score += pref_score
        breakdown["preferences"] = round((pref_score / 10) * 100)

        # 6. Projects / Experience (10%)
        projects = profile_doc.get("projects", [])
        experience = profile_doc.get("experience", [])
        proj_score = 0
        if (projects and len(projects) > 0) or (experience and len(experience) > 0):
            proj_score = 10
        else:
            missing.append("At least 1 Project or Experience")
        score += proj_score
        breakdown["projects_experience"] = round((proj_score / 10) * 100)

        final_percentage = min(100, score)
        return {
            "percentage": final_percentage,
            "breakdown": breakdown,
            "missing_items": missing
        }

    @classmethod
    def upsert_from_resume_extraction(cls, user_id: str, extracted_data: dict, resume_meta: dict):
        """
        Integrates AI-extracted resume data into student profile without overwriting
        existing manual configurations. Sets verification_status to 'needs_review'.
        """
        col = cls.get_collection()
        now = datetime.now(timezone.utc).isoformat()
        obj_id = ObjectId(user_id) if isinstance(user_id, str) else user_id

        existing = cls.find_by_user_id(user_id)

        # Helper to construct provenance field
        def make_field(section_key, field_key, default_val=None, default_conf=0.9):
            ext_sec = extracted_data.get(section_key, {})
            ext_val = ext_sec.get(field_key) if isinstance(ext_sec, dict) else None
            conf = extracted_data.get("confidence", {}).get(field_key, default_conf)

            # Preserve manual edits if previously entered manually
            if existing:
                cur_field = existing.get(section_key, {}).get(field_key, {})
                if cur_field.get("source") == "manual" and cur_field.get("value") is not None:
                    return cur_field

            if ext_val is not None and ext_val != "" and ext_val != []:
                return {
                    "value": ext_val,
                    "source": "resume",
                    "confidence": conf
                }
            return {
                "value": default_val,
                "source": "resume",
                "confidence": 0.0
            }

        # Skills categories
        skills_doc = {}
        for cat in ["programmingLanguages", "technical", "frameworks", "databases", "cloud", "tools"]:
            ext_skills = extracted_data.get("skills", {}).get(cat, [])
            # Merge with existing skills if any
            if existing and existing.get("skills", {}).get(cat, {}).get("source") == "manual":
                skills_doc[cat] = existing.get("skills", {}).get(cat)
            else:
                skills_doc[cat] = {
                    "value": ext_skills if isinstance(ext_skills, list) else [],
                    "source": "resume",
                    "confidence": 0.95 if ext_skills else 0.0
                }

        # Preferences (preserve manual or set empty)
        prefs_doc = existing.get("preferences", {}) if existing else {
            "targetRoles": {"value": [], "source": "manual"},
            "preferredLocations": {"value": [], "source": "manual"},
            "workModes": {"value": ["Remote", "Hybrid"], "source": "manual"}
        }

        profile_doc = {
            "user_id": obj_id,
            "personal": {
                "fullName": make_field("personal", "fullName"),
                "email": make_field("personal", "email"),
                "phone": make_field("personal", "phone"),
                "location": make_field("personal", "location"),
            },
            "education": {
                "college": make_field("education", "college"),
                "degree": make_field("education", "degree"),
                "branch": make_field("education", "branch"),
                "graduationYear": make_field("education", "graduationYear"),
                "cgpa": make_field("education", "cgpa"),
            },
            "skills": skills_doc,
            "projects": extracted_data.get("projects", []),
            "experience": extracted_data.get("experience", []),
            "certifications": extracted_data.get("certifications", []),
            "achievements": extracted_data.get("achievements", []),
            "interests": extracted_data.get("interests", []),
            "preferences": prefs_doc,
            "resume": {
                "fileName": resume_meta.get("fileName"),
                "filePath": resume_meta.get("filePath"),
                "fileSize": resume_meta.get("fileSize"),
                "uploadedAt": resume_meta.get("uploadedAt", now),
                "parsed": True,
                "analysisStatus": "completed"
            },
            "verification_status": "needs_review",
            "source_metadata": {
                "resumeExtractedFields": list(extracted_data.keys()),
                "lastAnalyzedAt": now
            },
            "updated_at": now
        }

        completion_info = cls.calculate_completion(profile_doc)
        profile_doc["profileCompletion"] = completion_info["percentage"]

        if existing:
            profile_doc["created_at"] = existing.get("created_at", now)
            col.update_one({"_id": existing["_id"]}, {"$set": profile_doc})
            profile_doc["_id"] = existing["_id"]
        else:
            profile_doc["created_at"] = now
            res = col.insert_one(profile_doc)
            profile_doc["_id"] = res.inserted_id

        return profile_doc

    @classmethod
    def update_profile(cls, user_id: str, updates: dict):
        """
        Updates profile fields and marks changed attributes with source: 'manual'.
        """
        col = cls.get_collection()
        profile = cls.find_by_user_id(user_id)
        now = datetime.now(timezone.utc).isoformat()
        obj_id = ObjectId(user_id) if isinstance(user_id, str) else user_id

        if not profile:
            profile = {
                "user_id": obj_id,
                "personal": {},
                "education": {},
                "skills": {},
                "projects": [],
                "experience": [],
                "certifications": [],
                "achievements": [],
                "interests": [],
                "preferences": {},
                "resume": {"parsed": False, "analysisStatus": "none"},
                "verification_status": "draft",
                "created_at": now,
                "updated_at": now
            }

        # Apply updates to sections
        for section in ["personal", "education", "preferences"]:
            if section in updates and isinstance(updates[section], dict):
                if section not in profile:
                    profile[section] = {}
                for k, v in updates[section].items():
                    if isinstance(v, dict) and "value" in v:
                        profile[section][k] = v
                    else:
                        profile[section][k] = {
                            "value": v,
                            "source": "manual",
                            "confidence": 1.0
                        }

        # Skills section
        if "skills" in updates and isinstance(updates["skills"], dict):
            if "skills" not in profile:
                profile["skills"] = {}
            for cat, val in updates["skills"].items():
                if isinstance(val, dict) and "value" in val:
                    profile["skills"][cat] = val
                else:
                    profile["skills"][cat] = {
                        "value": val if isinstance(val, list) else [],
                        "source": "manual",
                        "confidence": 1.0
                    }

        # Array sections
        for arr_sec in ["projects", "experience", "certifications", "achievements", "interests"]:
            if arr_sec in updates and isinstance(updates[arr_sec], list):
                profile[arr_sec] = updates[arr_sec]

        # Resume metadata and status updates
        if "resume" in updates and isinstance(updates["resume"], dict):
            profile["resume"] = updates["resume"]
        if "verification_status" in updates:
            profile["verification_status"] = updates["verification_status"]
        if "verified_at" in updates:
            profile["verified_at"] = updates["verified_at"]
        if "source_metadata" in updates:
            profile["source_metadata"] = updates["source_metadata"]

        profile["updated_at"] = now
        completion = cls.calculate_completion(profile)
        profile["profileCompletion"] = completion["percentage"]

        if "_id" in profile:
            col.update_one({"_id": profile["_id"]}, {"$set": profile})
        else:
            res = col.insert_one(profile)
            profile["_id"] = res.inserted_id

        return profile

    @classmethod
    def verify_profile(cls, user_id: str):
        """Marks profile as verified by the student."""
        col = cls.get_collection()
        profile = cls.find_by_user_id(user_id)
        if not profile:
            raise ValueError("Profile does not exist. Please upload a resume first.")

        now = datetime.now(timezone.utc).isoformat()
        col.update_one(
            {"_id": profile["_id"]},
            {"$set": {"verification_status": "verified", "verified_at": now, "updated_at": now}}
        )
        profile["verification_status"] = "verified"
        profile["verified_at"] = now

        # Update users collection flag
        db = Database.get_db()
        if db is not None:
            obj_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            db["users"].update_one({"_id": obj_id}, {"$set": {"profile_completed": True, "updated_at": now}})

        return profile

    @staticmethod
    def to_dict(profile_doc: dict) -> dict:
        """Converts MongoDB document to JSON-safe dictionary."""
        if not profile_doc:
            return {}
        data = dict(profile_doc)
        if "_id" in data:
            data["id"] = str(data["_id"])
            del data["_id"]
        if "user_id" in data:
            data["user_id"] = str(data["user_id"])

        # Attach dynamic completion breakdown
        data["completion_details"] = ProfileModel.calculate_completion(data)
        return data
