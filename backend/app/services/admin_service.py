import re
import math
import logging
import threading
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple
from bson import ObjectId

from app.models.user import UserModel
from app.models.opportunity import OpportunityModel
from app.models.application import ApplicationModel
from app.models.feedback import FeedbackModel
from app.models.source_run import SourceRunModel
from app.models.profile import ProfileModel
from app.models.audit_log import AuditLogModel
from app.utils.opportunity_normalizer import is_india_eligible, CANONICAL_TYPES, CANONICAL_CATEGORIES
from app.services.dedup_service import DeduplicationService
from app.services.ingestion_service import OpportunityIngestionService

logger = logging.getLogger(__name__)

# Global concurrency guard for manual source synchronization
_sync_lock = threading.Lock()
_is_syncing = False

class AdminService:
    """
    Core administrative service coordinating:
    - Overview KPIs & Aggregations
    - User Management & Account Suspension
    - Opportunity Moderation & Controlled Duplicate Merging
    - Source Health & Safe Trigger Operations
    - Platform Analytics & Feedback Resolution
    - Append-only Audit Log Telemetry
    """

    # =========================================================================
    # 1. OVERVIEW KPIS & CHARTS
    # =========================================================================

    @classmethod
    def get_overview_kpis(cls, period_days: int = 30) -> Dict[str, Any]:
        """
        Calculates production platform KPIs using real MongoDB queries and aggregations.
        """
        now = datetime.now(timezone.utc)
        period_start = (now - timedelta(days=period_days)).isoformat()
        now_iso = now.isoformat()

        # Users collection
        col_users = UserModel.get_collection()
        total_users = col_users.count_documents({})
        active_users = col_users.count_documents({"status": {"$ne": "suspended"}})
        suspended_users = col_users.count_documents({"status": "suspended"})
        new_users_period = col_users.count_documents({"created_at": {"$gte": period_start}})

        # Profiles collection
        col_profiles = ProfileModel.get_collection()
        completed_profiles = col_profiles.count_documents({
            "$or": [
                {"verification_status": "verified"},
                {"completion_percentage": {"$gte": 80}}
            ]
        })

        # Opportunities collection
        col_opps = OpportunityModel.get_collection()
        total_opportunities = col_opps.count_documents({})
        active_opportunities = col_opps.count_documents({"status": "active"})
        expired_opportunities = col_opps.count_documents({"status": "expired"})
        flagged_opportunities = col_opps.count_documents({"status": "scam_flagged"})
        pending_review_opportunities = col_opps.count_documents({"moderation_status": "pending_review"})

        # India-eligible active opportunities
        india_eligible_opportunities = col_opps.count_documents({
            "status": "active",
            "$or": [
                {"location.country": {"$regex": "^india$", "$options": "i"}},
                {"location.is_remote": True},
                {"work_mode": "Remote"}
            ]
        })

        # Duplicate candidates count (documents marked with duplicate flags or candidates)
        duplicate_candidates_count = col_opps.count_documents({
            "$or": [
                {"moderation_status": "duplicate_candidate"},
                {"has_duplicate_candidates": True}
            ]
        })

        # Applications collection
        col_apps = ApplicationModel.get_collection()
        total_applications = col_apps.count_documents({})
        new_applications_period = col_apps.count_documents({"created_at": {"$gte": period_start}})

        # Applications by canonical status
        app_status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        app_status_counts = {r["_id"]: r["count"] for r in col_apps.aggregate(app_status_pipeline) if r.get("_id")}

        # Source Runs
        latest_runs = SourceRunModel.get_latest_runs()
        total_connectors = len(latest_runs) if latest_runs else 6
        healthy_connectors = sum(1 for r in latest_runs if r.get("status") == "success")
        failed_connectors = sum(1 for r in latest_runs if r.get("status") == "failed")

        # Feedback / Reports
        col_feedback = FeedbackModel.get_collection()
        unread_feedback_reports = col_feedback.count_documents({
            "status": {"$ne": "reviewed"},
            "reason": {"$in": ["wrong_role", "wrong_location", "not_eligible", "salary_too_low", "other"]}
        })

        return {
            "period_days": period_days,
            "timestamp": now_iso,
            "users": {
                "total": total_users,
                "active": active_users,
                "suspended": suspended_users,
                "new_in_period": new_users_period,
                "completed_profiles": completed_profiles
            },
            "opportunities": {
                "total": total_opportunities,
                "active": active_opportunities,
                "india_eligible": india_eligible_opportunities,
                "pending_review": pending_review_opportunities,
                "flagged": flagged_opportunities,
                "expired": expired_opportunities,
                "duplicate_candidates": duplicate_candidates_count
            },
            "applications": {
                "total": total_applications,
                "new_in_period": new_applications_period,
                "by_status": app_status_counts
            },
            "sources": {
                "total_connectors": total_connectors,
                "healthy": healthy_connectors,
                "failed": failed_connectors,
                "system_status": "healthy" if failed_connectors == 0 else ("degraded" if healthy_connectors > 0 else "unhealthy")
            },
            "quality": {
                "unread_reports": unread_feedback_reports
            }
        }

    @classmethod
    def get_overview_charts(cls, period_days: int = 30) -> Dict[str, Any]:
        """
        Executes server-side aggregations for charts without dumping entire collections.
        """
        now = datetime.now(timezone.utc)
        period_start = (now - timedelta(days=period_days)).isoformat()

        col_users = UserModel.get_collection()
        col_opps = OpportunityModel.get_collection()
        col_apps = ApplicationModel.get_collection()
        col_runs = SourceRunModel.get_collection()
        col_feedback = FeedbackModel.get_collection()

        # 1. User registrations over time
        user_reg_pipeline = [
            {"$match": {"created_at": {"$gte": period_start}}},
            {"$project": {
                "date": {"$substr": ["$created_at", 0, 10]}
            }},
            {"$group": {
                "_id": "$date",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        reg_trend = [{"date": r["_id"], "count": r["count"]} for r in col_users.aggregate(user_reg_pipeline)]

        # 2. Opportunities by category
        cat_pipeline = [
            {"$match": {"status": "active"}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        category_distribution = [{"category": r["_id"] or "other", "count": r["count"]} for r in col_opps.aggregate(cat_pipeline)]

        # 3. Opportunities by source
        src_pipeline = [
            {"$match": {"status": "active"}},
            {"$group": {"_id": "$source.name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        source_distribution = [{"source": r["_id"] or "Direct / Platform", "count": r["count"]} for r in col_opps.aggregate(src_pipeline)]

        # 4. Freshness distribution
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_distribution = [{"status": r["_id"] or "unknown", "count": r["count"]} for r in col_opps.aggregate(status_pipeline)]

        # 5. Applications over time
        app_trend_pipeline = [
            {"$match": {"created_at": {"$gte": period_start}}},
            {"$project": {
                "date": {"$substr": ["$created_at", 0, 10]}
            }},
            {"$group": {
                "_id": "$date",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        app_trend = [{"date": r["_id"], "count": r["count"]} for r in col_apps.aggregate(app_trend_pipeline)]

        # 6. Connector success / failure history (last 50 runs)
        run_history_pipeline = [
            {"$sort": {"started_at": -1}},
            {"$limit": 50},
            {"$group": {
                "_id": "$source_name",
                "successes": {"$sum": {"$cond": [{"$eq": ["$status", "success"]}, 1, 0]}},
                "failures": {"$sum": {"$cond": [{"$eq": ["$status", "failed"]}, 1, 0]}},
                "total_accepted": {"$sum": "$accepted"},
                "total_duplicates": {"$sum": "$duplicates"}
            }}
        ]
        connector_stats = [
            {
                "source_name": r["_id"],
                "successes": r["successes"],
                "failures": r["failures"],
                "accepted": r["total_accepted"],
                "duplicates": r["total_duplicates"]
            }
            for r in col_runs.aggregate(run_history_pipeline)
        ]

        # 7. Feedback & report reasons
        feedback_pipeline = [
            {"$match": {"reason": {"$ne": None}}},
            {"$group": {"_id": "$reason", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        feedback_distribution = [{"reason": r["_id"], "count": r["count"]} for r in col_feedback.aggregate(feedback_pipeline)]

        return {
            "period_days": period_days,
            "user_registrations_trend": reg_trend,
            "opportunity_categories": category_distribution,
            "opportunity_sources": source_distribution,
            "opportunity_freshness": status_distribution,
            "application_trend": app_trend,
            "connector_stats": connector_stats,
            "feedback_reasons": feedback_distribution
        }

    # =========================================================================
    # 2. USER MANAGEMENT
    # =========================================================================

    @classmethod
    def list_users(
        cls,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc"
    ) -> Dict[str, Any]:
        """
        Retrieves paginated user list with secure projection.
        Guarantees password hashes, auth tokens, and raw secrets are never returned.
        """
        col = UserModel.get_collection()
        query: Dict[str, Any] = {}

        if search and search.strip():
            term = re.escape(search.strip())
            query["$or"] = [
                {"name": {"$regex": term, "$options": "i"}},
                {"email": {"$regex": term, "$options": "i"}}
            ]

        if role and role.lower() != "all":
            query["role"] = role.strip().lower()

        if status and status.lower() != "all":
            query["status"] = status.strip().lower()

        direction = -1 if sort_dir.lower() == "desc" else 1
        sort_fields = [("created_at", direction)]
        if sort_by in ("name", "email", "role", "status", "updated_at"):
            sort_fields = [(sort_by, direction)]

        skip = max(0, (page - 1) * limit)
        total_count = col.count_documents(query)
        cursor = col.find(query).sort(sort_fields).skip(skip).limit(limit)

        users = [UserModel.to_dict(doc) for doc in cursor]

        # Attach lightweight completion flags from student_profiles
        col_profiles = ProfileModel.get_collection()
        user_ids = [u["id"] for u in users]
        profiles = list(col_profiles.find({"user_id": {"$in": user_ids}}))
        profile_map = {p.get("user_id"): p for p in profiles}

        for u in users:
            prof = profile_map.get(u["id"])
            if prof:
                u["profile_completed"] = prof.get("verification_status") == "verified" or prof.get("completion_percentage", 0) >= 80
                u["target_role"] = prof.get("target_role") or prof.get("career_preferences", {}).get("primary_role", "")
            else:
                u["target_role"] = ""

        return {
            "users": users,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total_count / limit) if total_count > 0 else 1
        }

    @classmethod
    def get_user_details(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves controlled user summary for administrative review.
        Excludes raw resumes, password hashes, and sensitive API keys.
        """
        user_doc = UserModel.find_by_id(user_id)
        if not user_doc:
            return None

        user_data = UserModel.to_dict(user_doc)

        # Profile summary
        profile_doc = ProfileModel.find_by_user_id(user_id) or {}
        profile_dict = ProfileModel.to_dict(profile_doc) if profile_doc else {}

        # Applications count
        col_apps = ApplicationModel.get_collection()
        app_count = col_apps.count_documents({"user_id": str(user_id)})
        apps_by_status = list(col_apps.aggregate([
            {"$match": {"user_id": str(user_id)}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]))

        # Feedback count
        col_feedback = FeedbackModel.get_collection()
        feedback_count = col_feedback.count_documents({"user_id": str(user_id)})

        # Recent activities (sanitized timeline events)
        recent_apps = list(col_apps.find({"user_id": str(user_id)}).sort("updated_at", -1).limit(5))
        recent_activity = [
            {
                "type": "application",
                "id": str(a["_id"]),
                "company": a.get("company"),
                "role": a.get("role"),
                "status": a.get("status"),
                "updated_at": a.get("updated_at")
            }
            for a in recent_apps
        ]

        return {
            "user": user_data,
            "profile_summary": {
                "exists": bool(profile_doc),
                "full_name": profile_dict.get("full_name") or user_data.get("name"),
                "target_role": profile_dict.get("target_role"),
                "verification_status": profile_dict.get("verification_status", "unverified"),
                "skills_count": len(profile_dict.get("skills") or []),
                "saved_opportunities_count": len(profile_dict.get("saved_opportunities") or [])
            },
            "activity_summary": {
                "total_applications": app_count,
                "applications_by_status": {r["_id"]: r["count"] for r in apps_by_status if r.get("_id")},
                "feedback_events": feedback_count,
                "recent_activity": recent_activity
            }
        }

    @classmethod
    def set_user_status(
        cls,
        admin_id: str,
        admin_email: str,
        target_user_id: str,
        new_status: str,
        reason: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Suspends or reactivates an account with strict safeguards and audit logging.
        Prevents admins from suspending their own account.
        """
        if str(admin_id) == str(target_user_id) and new_status == "suspended":
            raise ValueError("Administrators cannot suspend their own active account.")

        if new_status not in ("active", "suspended"):
            raise ValueError("Invalid account status. Must be 'active' or 'suspended'.")

        target_user = UserModel.find_by_id(target_user_id)
        if not target_user:
            raise ValueError("User not found.")

        old_status = target_user.get("status", "active")
        if old_status == new_status:
            return UserModel.to_dict(target_user)

        UserModel.update_status(target_user_id, new_status)
        updated = UserModel.find_by_id(target_user_id)

        # Append audit log
        action_name = "USER_SUSPENDED" if new_status == "suspended" else "USER_REACTIVATED"
        AuditLogModel.record(
            admin_id=admin_id,
            admin_email=admin_email,
            action=action_name,
            target_type="user",
            target_id=target_user_id,
            details={
                "target_email": target_user.get("email"),
                "target_name": target_user.get("name"),
                "previous_status": old_status,
                "new_status": new_status,
                "reason": reason.strip() if reason else "Administrative action"
            },
            ip_address=ip_address,
            user_agent=user_agent
        )

        return UserModel.to_dict(updated)

    @classmethod
    def set_user_role(
        cls,
        admin_id: str,
        admin_email: str,
        target_user_id: str,
        new_role: str,
        reason: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Updates account role with safeguards against accidental self-lockout or removing
        the last admin. All role mutations are strictly audited.
        """
        if new_role not in ("student", "admin"):
            raise ValueError("Invalid role. Must be 'student' or 'admin'.")

        target_user = UserModel.find_by_id(target_user_id)
        if not target_user:
            raise ValueError("User not found.")

        old_role = target_user.get("role", "student")
        if old_role == new_role:
            return UserModel.to_dict(target_user)

        # Safeguard: cannot remove own admin access
        if str(admin_id) == str(target_user_id) and new_role != "admin":
            raise ValueError("Administrators cannot demote their own account. Another administrator must make this change.")

        # Safeguard: cannot remove the last active admin
        if old_role == "admin" and new_role != "admin":
            col = UserModel.get_collection()
            active_admin_count = col.count_documents({"role": "admin", "status": {"$ne": "suspended"}})
            if active_admin_count <= 1:
                raise ValueError("Cannot remove the last active administrator on the platform.")

        UserModel.update_role(target_user_id, new_role)
        updated = UserModel.find_by_id(target_user_id)

        AuditLogModel.record(
            admin_id=admin_id,
            admin_email=admin_email,
            action="USER_ROLE_CHANGED",
            target_type="user",
            target_id=target_user_id,
            details={
                "target_email": target_user.get("email"),
                "previous_role": old_role,
                "new_role": new_role,
                "reason": reason.strip() if reason else "Role change"
            },
            ip_address=ip_address,
            user_agent=user_agent
        )

        return UserModel.to_dict(updated)

    @classmethod
    def create_admin_user(
        cls,
        admin_id: str,
        admin_email: str,
        name: str,
        email: str,
        password: str,
        reason: str = "",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a new administrator account authorized by an existing administrator.
        Guarantees strict email validation, bcrypt hashing, and audit logging.
        """
        if not name or not name.strip():
            raise ValueError("Administrator name is required.")
        if not email or not email.strip():
            raise ValueError("Administrator email is required.")

        email_clean = email.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email_clean):
            raise ValueError("Please provide a valid email address.")

        if not password or len(password) < 8:
            raise ValueError("Administrator password must be at least 8 characters in length.")

        existing = UserModel.find_by_email(email_clean)
        if existing:
            if existing.get("role") == "admin":
                raise ValueError("An administrator account with this email address already exists.")
            else:
                raise ValueError(
                    f"A user with email '{email_clean}' already exists as a student. "
                    "You can promote their account to administrator from the user management directory."
                )

        # Create user via UserModel with role='admin' and status='active'
        new_user = UserModel.create_user(
            name=name.strip(),
            email=email_clean,
            password=password,
            role="admin",
            status="active"
        )
        if not new_user:
            raise RuntimeError("Failed to create administrator account in database.")

        user_dict = UserModel.to_dict(new_user)

        # Record audit log entry (explicitly omitting password)
        AuditLogModel.record(
            admin_id=admin_id,
            admin_email=admin_email,
            action="ADMIN_CREATED",
            target_type="user",
            target_id=user_dict["id"],
            details={
                "name": name.strip(),
                "email": email_clean,
                "role": "admin",
                "status": "active",
                "reason": reason.strip() if reason else "Authorized new platform administrator"
            },
            ip_address=ip_address,
            user_agent=user_agent
        )

        return user_dict

    # =========================================================================
    # 3. OPPORTUNITY VERIFICATION & MODERATION
    # =========================================================================

    @classmethod
    def list_opportunities(
        cls,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        filter_type: Optional[str] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc"
    ) -> Dict[str, Any]:
        """
        Advanced administrative opportunity search with review filters.
        """
        col = OpportunityModel.get_collection()
        query: Dict[str, Any] = {}

        if search and search.strip():
            term = re.escape(search.strip())
            query["$or"] = [
                {"title": {"$regex": term, "$options": "i"}},
                {"organization.name": {"$regex": term, "$options": "i"}},
                {"organization_name": {"$regex": term, "$options": "i"}},
                {"skills": {"$regex": term, "$options": "i"}}
            ]

        if status and status.lower() != "all":
            query["status"] = status.strip().lower()

        if category and category.lower() != "all":
            query["category"] = category.strip().lower()

        if source and source.lower() != "all":
            query["source.name"] = source.strip()

        # Specific review filters
        if filter_type:
            ft = filter_type.strip().lower()
            if ft == "pending_review":
                query["moderation_status"] = "pending_review"
            elif ft == "flagged":
                query["status"] = "scam_flagged"
            elif ft == "missing_location":
                query["$or"] = [
                    {"location": None},
                    {"location.city": None},
                    {"location.city": ""},
                    {"location.country": None}
                ]
            elif ft == "india_ineligible":
                query["$and"] = [
                    {"location.country": {"$not": {"$regex": "^india$", "$options": "i"}}},
                    {"location.is_remote": {"$ne": True}},
                    {"work_mode": {"$ne": "Remote"}}
                ]
            elif ft == "missing_url":
                query["$or"] = [
                    {"application_url": None},
                    {"application_url": ""},
                    {"application_url": {"$not": {"$regex": "^https?://", "$options": "i"}}}
                ]
            elif ft == "expired_deadline":
                today = datetime.now(timezone.utc).isoformat().split("T")[0]
                query["dates.deadline"] = {"$lt": today, "$ne": None}
            elif ft == "duplicate_candidates":
                query["$or"] = [
                    {"moderation_status": "duplicate_candidate"},
                    {"has_duplicate_candidates": True}
                ]

        direction = -1 if sort_dir.lower() == "desc" else 1
        sort_fields = [("created_at", direction)]
        if sort_by in ("title", "category", "type", "dates.deadline", "status", "created_at"):
            sort_fields = [(sort_by, direction)]

        skip = max(0, (page - 1) * limit)
        total_count = col.count_documents(query)
        cursor = col.find(query).sort(sort_fields).skip(skip).limit(limit)

        opps = [OpportunityModel.to_dict(doc) for doc in cursor]

        # Attach moderation status metadata if present
        for o, raw in zip(opps, cursor):
            o["moderation_status"] = raw.get("moderation_status", "approved" if raw.get("status") == "active" else "standard")
            o["moderation_notes"] = raw.get("moderation_notes", "")
            o["moderated_at"] = raw.get("moderated_at")
            o["duplicate_candidates"] = raw.get("duplicate_candidates", [])

        return {
            "opportunities": opps,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total_count / limit) if total_count > 0 else 1
        }

    @classmethod
    def get_opportunity_details(cls, opp_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves detailed opportunity record with moderation history,
        linked student application counts, and duplicate candidate comparisons.
        """
        doc = OpportunityModel.find_by_id(opp_id)
        if not doc:
            return None

        opp_dict = OpportunityModel.to_dict(doc)
        opp_dict["raw_hash"] = (doc.get("metadata") or {}).get("raw_hash")
        opp_dict["moderation_status"] = doc.get("moderation_status", "approved" if doc.get("status") == "active" else "standard")
        opp_dict["moderation_notes"] = doc.get("moderation_notes", "")
        opp_dict["moderated_by"] = doc.get("moderated_by")
        opp_dict["moderated_at"] = doc.get("moderated_at")

        # Check applications count referencing this opportunity
        col_apps = ApplicationModel.get_collection()
        opp_dict["tracked_applications_count"] = col_apps.count_documents({"opportunity_id": str(doc["_id"])})

        # Check saved bookmark count
        col_prof = ProfileModel.get_collection()
        opp_dict["saved_bookmarks_count"] = col_prof.count_documents({"saved_opportunities": str(doc["_id"])})

        # Discover potential duplicate candidate records in the database
        duplicates = cls.find_potential_duplicates(doc)
        opp_dict["potential_duplicates"] = duplicates

        return opp_dict

    @classmethod
    def find_potential_duplicates(cls, opp_doc: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
        """
        Discovers duplicate candidate records in the database based on title similarity,
        identical organization, or duplicate raw_hash.
        """
        col = OpportunityModel.get_collection()
        opp_id = opp_doc.get("_id")
        org_name = (opp_doc.get("organization") or {}).get("name", "")
        title = opp_doc.get("title", "")
        raw_hash = (opp_doc.get("metadata") or {}).get("raw_hash")

        candidates = []
        if not org_name or not title:
            return []

        # Find same organization matches
        matches = list(col.find({
            "_id": {"$ne": opp_id},
            "organization.name": {"$regex": f"^{re.escape(org_name.strip())}$", "$options": "i"},
            "status": {"$in": ["active", "expired", "closed"]}
        }).limit(20))

        for m in matches:
            m_title = m.get("title", "")
            m_hash = (m.get("metadata") or {}).get("raw_hash")
            sim = DeduplicationService._compute_title_similarity(title, m_title)

            is_dup = (raw_hash and raw_hash == m_hash) or (sim >= 0.85)
            if is_dup:
                candidates.append({
                    "id": str(m["_id"]),
                    "title": m_title,
                    "company": (m.get("organization") or {}).get("name", org_name),
                    "status": m.get("status"),
                    "similarity": round(sim, 2),
                    "application_url": m.get("application_url"),
                    "created_at": m.get("created_at")
                })
                if len(candidates) >= limit:
                    break

        return candidates

    @classmethod
    def moderate_opportunity(
        cls,
        admin_id: str,
        admin_email: str,
        opp_id: str,
        action: str,
        payload: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Performs safe, auditable moderation on an opportunity.
        Actions:
          - 'approve': Approves/verifies listing, marks status 'active'
          - 'mark_review': Flags for further moderation
          - 'retire': Safely retires listing without destroying student application history
          - 'update_metadata': Corrects supported metadata fields with validation
        """
        col = OpportunityModel.get_collection()
        doc = OpportunityModel.find_by_id(opp_id)
        if not doc:
            raise ValueError(f"Opportunity '{opp_id}' not found.")

        obj_id = doc["_id"]
        now = datetime.now(timezone.utc).isoformat()
        payload = payload or {}
        before_state = {
            "title": doc.get("title"),
            "status": doc.get("status"),
            "moderation_status": doc.get("moderation_status"),
            "category": doc.get("category"),
            "work_mode": doc.get("work_mode"),
            "deadline": (doc.get("dates") or {}).get("deadline")
        }

        if action == "approve":
            updates = {
                "status": "active",
                "moderation_status": "approved",
                "moderated_at": now,
                "moderated_by": str(admin_id),
                "moderation_notes": payload.get("notes", "Approved by administrator"),
                "updated_at": now
            }
            col.update_one({"_id": obj_id}, {"$set": updates})

        elif action == "mark_review":
            updates = {
                "moderation_status": "pending_review",
                "moderated_at": now,
                "moderated_by": str(admin_id),
                "moderation_notes": payload.get("notes", "Marked for review"),
                "updated_at": now
            }
            col.update_one({"_id": obj_id}, {"$set": updates})

        elif action == "retire":
            # Retiring an opportunity does NOT delete student applications or bookmarks
            updates = {
                "status": "retired",
                "moderation_status": "retired",
                "moderated_at": now,
                "moderated_by": str(admin_id),
                "moderation_notes": payload.get("notes", "Retired by administrator"),
                "updated_at": now
            }
            col.update_one({"_id": obj_id}, {"$set": updates})

        elif action == "update_metadata":
            updates = {"updated_at": now, "moderated_by": str(admin_id), "moderated_at": now}

            if "title" in payload:
                t = str(payload["title"]).strip()
                if len(t) < 3:
                    raise ValueError("Title must be at least 3 characters long.")
                updates["title"] = t

            if "organization" in payload or "company" in payload:
                org = str(payload.get("organization") or payload.get("company")).strip()
                if len(org) < 2:
                    raise ValueError("Organization name must be at least 2 characters long.")
                updates["organization.name"] = org

            if "category" in payload:
                cat = str(payload["category"]).strip().lower()
                if cat in CANONICAL_CATEGORIES:
                    updates["category"] = cat

            if "type" in payload:
                opp_type = str(payload["type"]).strip().lower()
                if opp_type in CANONICAL_TYPES:
                    updates["type"] = opp_type

            if "work_mode" in payload:
                updates["work_mode"] = str(payload["work_mode"]).strip().title()

            if "application_url" in payload:
                url = str(payload["application_url"]).strip()
                if not url.lower().startswith(("http://", "https://")):
                    raise ValueError("Application URL must be a valid HTTP or HTTPS address.")
                updates["application_url"] = url

            if "deadline" in payload:
                updates["dates.deadline"] = payload["deadline"]

            if "notes" in payload:
                updates["moderation_notes"] = payload["notes"]

            col.update_one({"_id": obj_id}, {"$set": updates})

        else:
            raise ValueError(f"Unsupported moderation action '{action}'.")

        updated_doc = OpportunityModel.find_by_id(opp_id)

        # Audit log
        AuditLogModel.record(
            admin_id=admin_id,
            admin_email=admin_email,
            action=f"OPPORTUNITY_{action.upper()}",
            target_type="opportunity",
            target_id=str(opp_id),
            details={
                "before": before_state,
                "action": action,
                "notes": payload.get("notes", ""),
                "opportunity_title": doc.get("title")
            },
            ip_address=ip_address,
            user_agent=user_agent
        )

        return OpportunityModel.to_dict(updated_doc)

    @classmethod
    def merge_duplicate_opportunities(
        cls,
        admin_id: str,
        admin_email: str,
        canonical_id: str,
        duplicate_id: str,
        reason: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Merges duplicate opportunity record into canonical record through a reversible,
        safe process.
        - Repoints student application references
        - Repoints student saved bookmarks
        - Repoints user feedback signals
        - Merges source links & skills onto canonical record
        - Retires duplicate record with merged_into link (does not delete record)
        - Logs comprehensive audit record
        """
        if str(canonical_id) == str(duplicate_id):
            raise ValueError("Canonical ID and Duplicate ID cannot be the same opportunity.")

        col_opps = OpportunityModel.get_collection()
        canonical_doc = OpportunityModel.find_by_id(canonical_id)
        duplicate_doc = OpportunityModel.find_by_id(duplicate_id)

        if not canonical_doc:
            raise ValueError(f"Canonical opportunity '{canonical_id}' not found.")
        if not duplicate_doc:
            raise ValueError(f"Duplicate opportunity '{duplicate_id}' not found.")

        now = datetime.now(timezone.utc).isoformat()
        c_oid = canonical_doc["_id"]
        d_oid = duplicate_doc["_id"]

        # 1. Update applications: change opportunity_id from duplicate_id to canonical_id
        col_apps = ApplicationModel.get_collection()
        app_res = col_apps.update_many(
            {"opportunity_id": str(d_oid)},
            {"$set": {"opportunity_id": str(c_oid), "updated_at": now}}
        )
        repointed_apps_count = app_res.modified_count

        # 2. Update student profile saved bookmarks: replace duplicate_id with canonical_id
        col_prof = ProfileModel.get_collection()
        col_prof.update_many(
            {"saved_opportunities": str(d_oid)},
            {"$addToSet": {"saved_opportunities": str(c_oid)}}
        )
        prof_res = col_prof.update_many(
            {"saved_opportunities": str(d_oid)},
            {"$pull": {"saved_opportunities": str(d_oid)}}
        )
        repointed_bookmarks_count = prof_res.modified_count

        # 3. Update student feedback signals
        col_feedback = FeedbackModel.get_collection()
        feedback_res = col_feedback.update_many(
            {"opportunity_id": str(d_oid)},
            {"$set": {"opportunity_id": str(c_oid), "updated_at": now}}
        )
        repointed_feedback_count = feedback_res.modified_count

        # 4. Merge source links and skills onto canonical record
        existing_links = canonical_doc.get("source_links") or []
        d_app_url = duplicate_doc.get("application_url")
        d_src_name = (duplicate_doc.get("source") or {}).get("name", "duplicate_merge")

        if d_app_url and not any(link.get("url") == d_app_url for link in existing_links):
            existing_links.append({
                "name": d_src_name,
                "url": d_app_url,
                "merged_at": now
            })

        c_skills = set(canonical_doc.get("skills") or [])
        d_skills = set(duplicate_doc.get("skills") or [])
        merged_skills = sorted(list(c_skills.union(d_skills)))

        col_opps.update_one(
            {"_id": c_oid},
            {
                "$set": {
                    "source_links": existing_links,
                    "skills": merged_skills,
                    "updated_at": now
                }
            }
        )

        # 5. Mark duplicate record as retired and merged_into canonical
        col_opps.update_one(
            {"_id": d_oid},
            {
                "$set": {
                    "status": "retired",
                    "moderation_status": "merged",
                    "merged_into": str(c_oid),
                    "moderated_by": str(admin_id),
                    "moderated_at": now,
                    "moderation_notes": f"Merged into canonical opportunity {canonical_id}. Reason: {reason}",
                    "updated_at": now
                }
            }
        )

        # 6. Audit log
        AuditLogModel.record(
            admin_id=admin_id,
            admin_email=admin_email,
            action="OPPORTUNITY_MERGED",
            target_type="opportunity",
            target_id=str(canonical_id),
            details={
                "canonical_id": str(canonical_id),
                "canonical_title": canonical_doc.get("title"),
                "duplicate_id": str(duplicate_id),
                "duplicate_title": duplicate_doc.get("title"),
                "repointed_applications": repointed_apps_count,
                "repointed_bookmarks": repointed_bookmarks_count,
                "repointed_feedback": repointed_feedback_count,
                "reason": reason
            },
            ip_address=ip_address,
            user_agent=user_agent
        )

        return {
            "canonical_id": str(canonical_id),
            "duplicate_id": str(duplicate_id),
            "repointed_applications": repointed_apps_count,
            "repointed_bookmarks": repointed_bookmarks_count,
            "repointed_feedback": repointed_feedback_count,
            "merged_skills_count": len(merged_skills)
        }

    # =========================================================================
    # 4. SOURCE OPERATIONS & INGESTION TELEMETRY
    # =========================================================================

    @classmethod
    def get_sources_overview(cls) -> Dict[str, Any]:
        """
        Returns connector operational statuses, historical metrics, and background scheduler health.
        """
        canonical_sources = [
            {"source_name": "ats_job_boards", "display_name": "Indian Unicorn & GCC ATS Job Boards", "type": "public_ats_boards", "schedule": "Every 2 hours"},
            {"source_name": "unstop_api", "display_name": "Unstop India Tech Opportunities", "type": "internships_and_jobs", "schedule": "Every 3 hours"},
            {"source_name": "devfolio_api", "display_name": "Devfolio India University Hackathons", "type": "hackathon", "schedule": "Every 6 hours"},
            {"source_name": "remotive_api", "display_name": "Remotive India & Global Remote Tech", "type": "remote_jobs", "schedule": "Every 4 hours"},
            {"source_name": "codeforces_api", "display_name": "Codeforces Contests API", "type": "coding_contest", "schedule": "Every 1 hour"},
            {"source_name": "opportunitydesk_rss", "display_name": "India & Global Fellowships Feed", "type": "scholarship", "schedule": "Every 12 hours"}
        ]

        latest_runs = SourceRunModel.get_latest_runs()
        run_map = {r.get("source_name"): r for r in latest_runs}

        statuses = []
        healthy_count = 0
        failed_count = 0

        for src in canonical_sources:
            s_name = src["source_name"]
            last_run = run_map.get(s_name) or {}
            st = last_run.get("status", "ready")
            if st == "success":
                healthy_count += 1
            elif st == "failed":
                failed_count += 1

            statuses.append({
                "source_name": s_name,
                "display_name": src["display_name"],
                "type": src["type"],
                "schedule": src["schedule"],
                "status": st,
                "last_synced_at": last_run.get("completed_at"),
                "last_success_at": last_run.get("last_successful_at") or (last_run.get("completed_at") if last_run.get("status") == "success" else None),
                "duration_seconds": last_run.get("duration_seconds", 0.0),
                "items_fetched": last_run.get("fetched", 0),
                "items_accepted": last_run.get("accepted", 0),
                "items_updated": last_run.get("updated", 0),
                "items_duplicates": last_run.get("duplicates", 0),
                "items_rejected": last_run.get("rejected", 0),
                "last_error": str(last_run.get("error"))[:200] if last_run.get("error") else None
            })

        overall_status = "healthy" if failed_count == 0 else ("degraded" if healthy_count > 0 else "unhealthy")

        return {
            "system_status": overall_status,
            "is_syncing": _is_syncing,
            "healthy_count": healthy_count,
            "failed_count": failed_count,
            "total_connectors": len(canonical_sources),
            "connectors": statuses
        }

    @classmethod
    def trigger_source_sync(
        cls,
        admin_id: str,
        admin_email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes an immediate manual synchronization of external opportunities.
        Enforces concurrency lock to prevent overlapping runs.
        """
        global _is_syncing
        if not _sync_lock.acquire(blocking=False):
            raise ValueError("An opportunity ingestion sync is already in progress.")

        try:
            _is_syncing = True
            service = OpportunityIngestionService()
            metrics = service.run_ingestion()

            # Record audit log
            AuditLogModel.record(
                admin_id=admin_id,
                admin_email=admin_email,
                action="SOURCES_SYNC_TRIGGERED",
                target_type="source",
                details={
                    "total_accepted": metrics.get("total_accepted", 0),
                    "total_duplicates": metrics.get("total_duplicates", 0),
                    "total_rejected": metrics.get("total_rejected", 0),
                    "duration_seconds": metrics.get("duration_seconds", 0.0)
                },
                ip_address=ip_address,
                user_agent=user_agent
            )

            return metrics
        finally:
            _is_syncing = False
            _sync_lock.release()

    # =========================================================================
    # 5. PLATFORM ANALYTICS & FEEDBACK MODERATION
    # =========================================================================

    @classmethod
    def list_feedback_reports(
        cls,
        page: int = 1,
        limit: int = 20,
        event_type: Optional[str] = None,
        reason: Optional[str] = None,
        rating: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves paginated feedback signals and reported listings for admin moderation.
        """
        col = FeedbackModel.get_collection()
        query: Dict[str, Any] = {}

        if event_type and event_type.lower() != "all":
            query["event_type"] = event_type.strip().lower()

        if reason and reason.lower() != "all":
            query["reason"] = reason.strip().lower()

        if rating and rating.lower() != "all":
            query["rating"] = rating.strip().lower()

        if status and status.lower() != "all":
            query["status"] = status.strip().lower()

        if search and search.strip():
            term = re.escape(search.strip())
            query["$or"] = [
                {"company": {"$regex": term, "$options": "i"}},
                {"category": {"$regex": term, "$options": "i"}},
                {"reason": {"$regex": term, "$options": "i"}},
                {"user_id": {"$regex": term, "$options": "i"}}
            ]

        skip = max(0, (page - 1) * limit)
        total_count = col.count_documents(query)
        cursor = col.find(query).sort("created_at", -1).skip(skip).limit(limit)

        items = [FeedbackModel.to_dict(d) for d in cursor]

        # Attach linked opportunity titles if available
        opp_ids = [d.get("opportunity_id") for d in items if d.get("opportunity_id")]
        col_opps = OpportunityModel.get_collection()
        opp_docs = list(col_opps.find({"_id": {"$in": [ObjectId(i) for i in opp_ids if ObjectId.is_valid(i)]}}))
        opp_map = {str(o["_id"]): o.get("title") for o in opp_docs}

        for item in items:
            item["opportunity_title"] = opp_map.get(item.get("opportunity_id"), "Opportunity")

        return {
            "feedback": items,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total_count / limit) if total_count > 0 else 1
        }

    @classmethod
    def resolve_feedback_report(
        cls,
        admin_id: str,
        admin_email: str,
        feedback_id: str,
        resolution_notes: str,
        action_taken: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Resolves a feedback report with notes and logs the moderation decision.
        """
        col = FeedbackModel.get_collection()
        obj_id = ObjectId(feedback_id) if ObjectId.is_valid(feedback_id) else feedback_id

        doc = col.find_one({"_id": obj_id})
        if not doc:
            raise ValueError(f"Feedback item '{feedback_id}' not found.")

        now = datetime.now(timezone.utc).isoformat()
        col.update_one(
            {"_id": obj_id},
            {
                "$set": {
                    "status": "reviewed",
                    "resolution_notes": resolution_notes.strip(),
                    "action_taken": action_taken.strip(),
                    "resolved_by": str(admin_id),
                    "resolved_at": now,
                    "updated_at": now
                }
            }
        )

        AuditLogModel.record(
            admin_id=admin_id,
            admin_email=admin_email,
            action="FEEDBACK_REPORT_RESOLVED",
            target_type="feedback",
            target_id=str(feedback_id),
            details={
                "resolution_notes": resolution_notes,
                "action_taken": action_taken,
                "opportunity_id": doc.get("opportunity_id"),
                "reason": doc.get("reason")
            },
            ip_address=ip_address,
            user_agent=user_agent
        )

        updated = col.find_one({"_id": obj_id})
        return FeedbackModel.to_dict(updated)

    # =========================================================================
    # 6. AUDIT LOGS & ADMINISTRATIVE SETTINGS
    # =========================================================================

    @classmethod
    def list_audit_logs(
        cls,
        page: int = 1,
        limit: int = 25,
        admin_id: Optional[str] = None,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves paginated, read-only audit log records.
        """
        query: Dict[str, Any] = {}

        if admin_id and admin_id.strip():
            query["admin_id"] = admin_id.strip()

        if action and action.strip().lower() != "all":
            query["action"] = action.strip().upper()

        if target_type and target_type.strip().lower() != "all":
            query["target_type"] = target_type.strip().lower()

        if date_from or date_to:
            date_query: Dict[str, Any] = {}
            if date_from:
                date_query["$gte"] = date_from
            if date_to:
                date_query["$lte"] = date_to
            query["created_at"] = date_query

        skip = max(0, (page - 1) * limit)
        total_count = AuditLogModel.count_logs(query)
        logs = AuditLogModel.find_paginated(query, skip=skip, limit=limit)

        return {
            "audit_logs": logs,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total_count / limit) if total_count > 0 else 1
        }

    @classmethod
    def get_system_settings(cls) -> Dict[str, Any]:
        """
        Returns safe system configuration and environmental status.
        Guarantees no passwords, tokens, or JWT secrets are exposed.
        """
        import os
        from app.services.scheduler import _scheduler

        scheduler_running = _scheduler is not None and getattr(_scheduler, "running", False)

        return {
            "environment": os.getenv("FLASK_ENV", "production"),
            "background_scheduler_enabled": os.getenv("ENABLE_BACKGROUND_SCHEDULER", "true").lower() in ("true", "1", "yes"),
            "scheduler_active": scheduler_running,
            "ingestion_interval_hours": int(os.getenv("OPPORTUNITY_INGESTION_HOURS", 6)),
            "seed_on_startup": os.getenv("OPPORTUNITY_SEED_ON_STARTUP", "true").lower() in ("true", "1", "yes"),
            "supported_connectors": [
                {"name": "ats_job_boards", "type": "public_ats_boards", "status": "active"},
                {"name": "unstop_api", "type": "internships_and_jobs", "status": "active"},
                {"name": "devfolio_api", "type": "hackathons", "status": "active"},
                {"name": "remotive_api", "type": "remote_jobs", "status": "active"},
                {"name": "codeforces_api", "type": "coding_contests", "status": "active"},
                {"name": "opportunitydesk_rss", "type": "fellowships_scholarships", "status": "active"}
            ],
            "security": {
                "jwt_algorithm": "HS256",
                "jwt_expiration_hours": 24,
                "role_enforcement": "server_side_mongodb_verified",
                "audit_logging": "enabled_append_only"
            }
        }
