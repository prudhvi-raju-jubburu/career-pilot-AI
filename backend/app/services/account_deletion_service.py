from datetime import datetime, timezone
import os
import logging
from typing import Dict, Any, Tuple
from bson import ObjectId
from app.config.db import Database
from app.models.user import UserModel
from app.models.profile import ProfileModel
from app.models.audit_log import AuditLogModel

logger = logging.getLogger(__name__)

class AccountDeletionService:
    """
    Handles secure, permanent student account deletion and cascading data cleanup.
    Preserves shared system assets (opportunities, companies, system metrics).
    """

    @classmethod
    def delete_account(cls, user_id: str, password: str, confirmation: str) -> Tuple[bool, str, int]:
        """
        Permanently deletes a student account and cascades across all personal collections.
        Returns: (success: bool, message: str, status_code: int)
        """
        if not user_id:
            return False, "User ID is required", 400

        if not confirmation or str(confirmation).strip() != "DELETE":
            return False, "You must type 'DELETE' exactly to confirm account deletion", 400

        user = UserModel.find_by_id(user_id)
        if not user:
            return False, "User account not found", 404

        # Verify password
        stored_hash = user.get("password_hash")
        if not UserModel.verify_password(stored_hash, password):
            return False, "Incorrect password. Account deletion aborted.", 401

        db = Database.get_db()
        if db is None:
            return False, "Database connection unavailable", 500

        obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        uid_str = str(user_id)

        cleanup_summary = {}
        failed_files = []

        try:
            # Stage 1: Immediately deactivate user account and disconnect active sockets to prevent concurrent API access
            db.users.update_one({"_id": obj_id}, {"$set": {"status": "suspended", "deletion_pending": True}})
            try:
                from app.socket import disconnect_user
                disconnect_user(uid_str)
            except Exception:
                pass

            # Stage 2: Clean up physical resume files on disk
            profile = db.student_profiles.find_one({"$or": [{"user_id": uid_str}, {"user_id": obj_id}]})
            if profile:
                resume_info = profile.get("resume") or {}
                file_path = resume_info.get("file_path")
                if file_path and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        logger.info("Deleted physical resume file: %s", file_path)
                    except Exception as e:
                        logger.warning("Could not remove physical resume file %s: %s", file_path, str(e))
                        failed_files.append({"path": file_path, "error": str(e)})
                        # Persist failed file path independently of the user document for administrative retry
                        try:
                            db.failed_file_cleanups.insert_one({
                                "file_path": file_path,
                                "user_id": uid_str,
                                "error": str(e),
                                "failed_at": datetime.now(timezone.utc).isoformat(),
                                "resolved": False
                            })
                        except Exception as q_err:
                            logger.error("Failed to queue file cleanup: %s", str(q_err))

            # Stage 3: Delete Student Profile and personal collections
            res_prof = db.student_profiles.delete_many({"$or": [{"user_id": uid_str}, {"user_id": obj_id}]})
            cleanup_summary["student_profiles"] = res_prof.deleted_count

            res_apps = db.applications.delete_many({"$or": [{"user_id": uid_str}, {"user_id": obj_id}]})
            cleanup_summary["applications"] = res_apps.deleted_count

            res_notifs = db.notifications.delete_many({"user_id": uid_str})
            cleanup_summary["notifications"] = res_notifs.deleted_count

            res_prefs = db.notification_preferences.delete_many({"user_id": uid_str})
            cleanup_summary["notification_preferences"] = res_prefs.deleted_count

            res_ievents = db.interview_events.delete_many({"user_id": uid_str})
            cleanup_summary["interview_events"] = res_ievents.deleted_count

            res_ipreps = db.interview_prep_packs.delete_many({"user_id": uid_str})
            cleanup_summary["interview_prep_packs"] = res_ipreps.deleted_count

            res_tests = db.mock_test_attempts.delete_many({"user_id": uid_str})
            cleanup_summary["mock_test_attempts"] = res_tests.deleted_count

            res_isess = db.interview_sessions.delete_many({"user_id": uid_str})
            cleanup_summary["interview_sessions"] = res_isess.deleted_count

            res_resumes = db.generated_resumes.delete_many({"user_id": uid_str})
            cleanup_summary["generated_resumes"] = res_resumes.deleted_count

            res_learn = db.learning_progress.delete_many({"$or": [{"user_id": uid_str}, {"user_id": obj_id}]})
            cleanup_summary["learning_progress"] = res_learn.deleted_count

            res_fb = db.user_feedback.delete_many({"user_id": uid_str})
            cleanup_summary["user_feedback"] = res_fb.deleted_count

            res_dig = db.digest_deliveries.delete_many({"user_id": uid_str})
            cleanup_summary["digest_deliveries"] = res_dig.deleted_count

            # Clean copilot conversations
            res_copilot = db.copilot_conversations.delete_many({"user_id": uid_str})
            cleanup_summary["copilot_conversations"] = res_copilot.deleted_count

            db.advisor_conversations.delete_many({"user_id": uid_str})

            # Stage 4: Permanently delete the User record itself
            res_user = db.users.delete_one({"_id": obj_id})
            cleanup_summary["users"] = res_user.deleted_count

            # Stage 5: Anonymized Audit log (zero PII: no email, no name)
            try:
                AuditLogModel.record_event(
                    action="user_account_deleted",
                    actor_id=uid_str,
                    target_id=uid_str,
                    details={
                        "role": user.get("role", "student"),
                        "cleanup_summary": cleanup_summary,
                        "failed_files": failed_files
                    }
                )
            except Exception as e:
                logger.warning("Could not write audit log for user deletion: %s", str(e))

            # Stage 6: Disconnect active socket session for this user
            try:
                from app.socket import disconnect_user
                disconnect_user(uid_str)
            except Exception:
                pass

            logger.info("Successfully completed staged deletion for user %s. Summary: %s", uid_str, cleanup_summary)
            return True, "Your account and all associated personal data have been permanently deleted.", 200

        except Exception as e:
            logger.exception("Error during account deletion for user %s: %s", uid_str, str(e))
            return False, f"Account deletion failed due to internal error: {str(e)}", 500

    @classmethod
    def retry_failed_file_cleanups(cls) -> Dict[str, Any]:
        """
        Retries deletion of failed files persisted independently in db.failed_file_cleanups.
        Can run safely after user documents have been permanently removed. Idempotent.
        """
        db = Database.get_db()
        if db is None:
            return {"attempted": 0, "resolved": 0, "still_failed": 0}

        unresolved = list(db.failed_file_cleanups.find({"resolved": False}))
        attempted = len(unresolved)
        resolved_count = 0
        still_failed = 0

        for item in unresolved:
            f_path = item.get("file_path")
            doc_id = item.get("_id")
            if not f_path or not os.path.exists(f_path):
                # File already gone
                db.failed_file_cleanups.update_one(
                    {"_id": doc_id},
                    {"$set": {"resolved": True, "resolved_at": datetime.now(timezone.utc).isoformat(), "note": "File already removed"}}
                )
                resolved_count += 1
                continue

            try:
                os.remove(f_path)
                db.failed_file_cleanups.update_one(
                    {"_id": doc_id},
                    {"$set": {"resolved": True, "resolved_at": datetime.now(timezone.utc).isoformat()}}
                )
                resolved_count += 1
            except Exception as e:
                still_failed += 1
                db.failed_file_cleanups.update_one(
                    {"_id": doc_id},
                    {"$set": {"last_retry_error": str(e), "last_retry_at": datetime.now(timezone.utc).isoformat()}}
                )

        return {
            "attempted": attempted,
            "resolved": resolved_count,
            "still_failed": still_failed
        }

