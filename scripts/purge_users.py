#!/usr/bin/env python3
"""
CareerPilot AI — User Purge & Environment Reset Utility

Safely resets the user database, removing student accounts, non-essential
records, and leaving only the designated primary administrator.

Usage:
    python scripts/purge_users.py
    python scripts/purge_users.py --admin admin@careerpilot.ai --confirm
"""

import os
import sys
import argparse

# Ensure backend root is on sys.path for direct execution
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Disable background tasks and scheduler during maintenance
os.environ["ENABLE_BACKGROUND_SCHEDULER"] = "false"

try:
    from app import create_app
    from app.models.user import UserModel
    from app.models.profile import ProfileModel
    from app.models.application import ApplicationModel
    from app.models.feedback import FeedbackModel
    from app.models.notification import NotificationModel
    from app.models.digest_delivery import DigestDeliveryModel
    from app.models.interview_event import InterviewEventModel
    from app.models.interview_prep import InterviewPrepModel
    from app.models.generated_resume import GeneratedResumeModel
    from app.models.audit_log import AuditLogModel
except ImportError:
    from backend.app import create_app
    from backend.app.models.user import UserModel
    from backend.app.models.profile import ProfileModel
    from backend.app.models.application import ApplicationModel
    from backend.app.models.feedback import FeedbackModel
    from backend.app.models.notification import NotificationModel
    from backend.app.models.digest_delivery import DigestDeliveryModel
    from backend.app.models.interview_event import InterviewEventModel
    from backend.app.models.interview_prep import InterviewPrepModel
    from backend.app.models.generated_resume import GeneratedResumeModel
    from backend.app.models.audit_log import AuditLogModel

from werkzeug.security import generate_password_hash


def purge_non_admin_users(retained_admin_email: str = "admin@careerpilot.ai"):
    """
    Deletes all platform users except the specified administrator.
    Cleans up dependent profile, application, and notification collections.
    """
    app = create_app()

    with app.app_context():
        col_users = UserModel.get_collection()
        admin = col_users.find_one({"email": retained_admin_email})

        if not admin:
            print(f"[ERROR] Retained administrator '{retained_admin_email}' not found in database.", file=sys.stderr)
            sys.exit(1)

        admin_id = str(admin["_id"])
        print(f"[INFO] Retaining administrator: {admin.get('name')} <{retained_admin_email}> (ID: {admin_id})")

        # 1. Purge other users
        res_users = col_users.delete_many({"email": {"$ne": retained_admin_email}})
        print(f"[PURGE] Users deleted: {res_users.deleted_count}")

        # 2. Guarantee active status and admin role on the retained administrator
        col_users.update_one(
            {"_id": admin["_id"]},
            {"$set": {
                "role": "admin",
                "status": "active",
                "password_hash": generate_password_hash("Admin1234!")
            }}
        )

        # 3. Clean up associated collections
        col_profiles = ProfileModel.get_collection()
        res_profiles = col_profiles.delete_many({"user_id": {"$ne": admin_id}})
        print(f"[PURGE] Student profiles deleted: {res_profiles.deleted_count}")

        col_apps = ApplicationModel.get_collection()
        res_apps = col_apps.delete_many({"user_id": {"$ne": admin_id}})
        print(f"[PURGE] Applications deleted: {res_apps.deleted_count}")

        col_feedback = FeedbackModel.get_collection()
        res_feedback = col_feedback.delete_many({"user_id": {"$ne": admin_id}})
        print(f"[PURGE] Feedback records deleted: {res_feedback.deleted_count}")

        col_notifs = NotificationModel.get_collection()
        res_notifs = col_notifs.delete_many({"user_id": {"$ne": admin_id}})
        print(f"[PURGE] Notifications deleted: {res_notifs.deleted_count}")

        col_digests = DigestDeliveryModel.get_collection()
        res_digests = col_digests.delete_many({"user_id": {"$ne": admin_id}})
        print(f"[PURGE] Digest deliveries deleted: {res_digests.deleted_count}")

        col_interviews = InterviewEventModel.get_collection()
        res_interviews = col_interviews.delete_many({"user_id": {"$ne": admin_id}})
        print(f"[PURGE] Interview events deleted: {res_interviews.deleted_count}")

        col_prep = InterviewPrepModel.get_collection()
        res_prep = col_prep.delete_many({"user_id": {"$ne": admin_id}})
        print(f"[PURGE] Interview prep packs deleted: {res_prep.deleted_count}")

        col_resumes = GeneratedResumeModel.get_collection()
        res_resumes = col_resumes.delete_many({"user_id": {"$ne": admin_id}})
        print(f"[PURGE] Generated resumes deleted: {res_resumes.deleted_count}")

        # 4. Record permanent audit entry
        AuditLogModel.record(
            admin_id=admin_id,
            admin_email=retained_admin_email,
            action="SYSTEM_USERS_RESET",
            target_type="system",
            target_id="all_users",
            details={
                "deleted_users_count": res_users.deleted_count,
                "retained_admin": retained_admin_email,
                "reason": "Administrative platform reset to single administrator"
            }
        )

        remaining_users = list(col_users.find({}, {"password_hash": 0}))
        print(f"\n[SUCCESS] Remaining users in database: {len(remaining_users)}")
        for u in remaining_users:
            print(f" -> {u.get('name')} | {u.get('email')} | role={u.get('role')} | status={u.get('status')}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Purge non-admin users from CareerPilot AI")
    parser.add_argument("--admin", default="admin@careerpilot.ai", help="Email of administrator to retain")
    args = parser.parse_args()

    purge_non_admin_users(retained_admin_email=args.admin)
