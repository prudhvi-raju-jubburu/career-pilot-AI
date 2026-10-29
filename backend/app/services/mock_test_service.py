import copy
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId

from app.models.application import ApplicationModel
from app.models.interview_prep import InterviewPrepModel
from app.models.mock_test_attempt import MockTestAttemptModel
from app.services.mock_test_question_bank import get_questions_by_category, get_all_mock_questions, MOCK_TEST_QUESTIONS
from app.services.resource_catalog import get_resources_by_skill
from app.ai.ai_service import AIService

logger = logging.getLogger(__name__)

CANONICAL_TEST_CATEGORIES = [
    {
        "id": "technical_mcqs",
        "name": "Technical MCQs",
        "description": "Comprehensive engineering MCQs covering concurrency, distributed systems, architecture, and CS theory.",
        "recommended_difficulty": "Medium",
        "default_count": 5,
        "default_time_minutes": 10
    },
    {
        "id": "prog_lang",
        "name": "Programming Language Fundamentals",
        "description": "Core language mechanics, memory models, runtime internals, event loop, and OOP principles.",
        "recommended_difficulty": "Medium",
        "default_count": 5,
        "default_time_minutes": 10
    },
    {
        "id": "dsa",
        "name": "Data Structures & Algorithms",
        "description": "Arrays, hash tables, binary search trees, graph traversals, and dynamic programming foundations.",
        "recommended_difficulty": "Medium",
        "default_count": 5,
        "default_time_minutes": 15
    },
    {
        "id": "sql_db",
        "name": "SQL & Databases",
        "description": "Relational schema design, complex JOINs, B-Tree indexing, ACID transactions, and normalization.",
        "recommended_difficulty": "Medium",
        "default_count": 5,
        "default_time_minutes": 10
    },
    {
        "id": "os_net",
        "name": "Operating Systems, Networking, and DBMS",
        "description": "Processes vs threads, deadlock prevention, TCP 3-way handshake, HTTP protocols, and virtual memory.",
        "recommended_difficulty": "Medium",
        "default_count": 5,
        "default_time_minutes": 10
    },
    {
        "id": "aptitude",
        "name": "Aptitude and Logical Reasoning",
        "description": "Quantitative speed math, set theory, permutation/combination, time & work, and deductive logic puzzles.",
        "recommended_difficulty": "Easy",
        "default_count": 5,
        "default_time_minutes": 10
    },
    {
        "id": "job_tech",
        "name": "Job-Specific Technologies",
        "description": "Containerization (Docker), caching (Redis), RESTful API design, and cloud deployments.",
        "recommended_difficulty": "Medium",
        "default_count": 5,
        "default_time_minutes": 10
    },
    {
        "id": "resume_proj",
        "name": "Resume and Project Concepts",
        "description": "Production engineering patterns, authentication security, cursor pagination, and scaling trade-offs.",
        "recommended_difficulty": "Hard",
        "default_count": 5,
        "default_time_minutes": 15
    }
]

class MockTestService:
    """
    Production-ready Mock-Test Engine for student job application preparation.
    Supports role-tailored categories, server-authoritative timer enforcement,
    deterministic objective scoring, and actionable roadmap revision links.
    """

    @classmethod
    def get_available_categories(cls, application_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Returns role-appropriate mock test categories with inventory counts."""
        app_doc = ApplicationModel.find_by_id(application_id, user_id=user_id)
        if not app_doc:
            raise ValueError("Application not found or unauthorized")

        role_title = (app_doc.get("role") or "").lower()

        # Filter and rank categories based on role
        results = []
        for cat in CANONICAL_TEST_CATEGORIES:
            cat_copy = dict(cat)
            q_pool = get_questions_by_category(cat["name"])
            cat_copy["available_questions"] = len(q_pool)

            # Role tailoring
            is_relevant = True
            if "frontend" in role_title:
                if cat["id"] in ("sql_db", "os_net"):
                    cat_copy["recommended"] = False
                else:
                    cat_copy["recommended"] = True
            elif "data" in role_title:
                if cat["id"] in ("os_net",):
                    cat_copy["recommended"] = False
                else:
                    cat_copy["recommended"] = True
            else:
                cat_copy["recommended"] = True

            results.append(cat_copy)

        return results

    @classmethod
    def start_test_attempt(
        cls,
        application_id: str,
        user_id: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Starts a new mock test attempt or resumes an active in-progress attempt.
        Never reveals correct answers or explanations in the returned payload.
        """
        user_str = str(user_id)
        app_str = str(application_id)

        app_doc = ApplicationModel.find_by_id(app_str, user_id=user_str)
        if not app_doc:
            raise ValueError("Application not found or unauthorized")

        # Check for existing active in-progress attempt
        existing_attempts = MockTestAttemptModel.find_by_application(app_str, user_str)
        now_dt = datetime.now(timezone.utc)

        for att in existing_attempts:
            if att.get("status") == "in_progress":
                exp_str = att.get("expires_at")
                if exp_str:
                    try:
                        exp_dt = datetime.fromisoformat(exp_str)
                        if exp_dt.tzinfo is None:
                            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
                        if now_dt > exp_dt:
                            # Auto-expire overdue attempt
                            cls._auto_expire_attempt(att["id"], user_str)
                            continue
                    except Exception:
                        pass
                # Resume active attempt
                full_doc = MockTestAttemptModel.find_by_id(att["id"], user_id=user_str)
                if full_doc and full_doc.get("status") == "in_progress":
                    return cls._format_active_payload(full_doc)

        # Parse requested configuration
        category_name = config.get("category", "Technical MCQs")
        difficulty = config.get("difficulty", "Medium")
        question_count = int(config.get("question_count", 10))
        question_count = max(3, min(question_count, 25))
        is_timed = bool(config.get("is_timed", True))
        time_limit_minutes = int(config.get("time_limit_minutes", 15))
        time_limit_minutes = max(3, min(time_limit_minutes, 60))

        # Select questions from verified question bank
        pool = get_questions_by_category(category_name)
        if not pool:
            pool = get_all_mock_questions()

        # Prioritize matching difficulty if specified
        if difficulty in ("Easy", "Medium", "Hard"):
            diff_matched = [q for q in pool if q.get("difficulty") == difficulty]
            if len(diff_matched) >= question_count:
                selected_pool = diff_matched[:question_count]
            else:
                remaining = [q for q in pool if q not in diff_matched]
                selected_pool = (diff_matched + remaining)[:question_count]
        else:
            selected_pool = pool[:question_count]

        if not selected_pool:
            raise ValueError("Insufficient questions available for the selected category.")

        # Prepare question snapshots (frozen for attempt lifetime)
        questions_snapshot = []
        for idx, q in enumerate(selected_pool, start=1):
            q_snap = copy.deepcopy(q)
            q_snap["id"] = f"q_{idx}"
            q_snap["is_practice_question"] = True
            q_snap["is_official_exam_question"] = False
            if "question_text" in q_snap and "question" not in q_snap:
                q_snap["question"] = q_snap["question_text"]
            questions_snapshot.append(q_snap)

        started_at = now_dt.isoformat()
        expires_at = (now_dt + timedelta(minutes=time_limit_minutes)).isoformat() if is_timed else None

        role_title = app_doc.get("role") or "Candidate Role"
        company_name = app_doc.get("company") or "Target Organization"

        attempt_data = {
            "user_id": user_str,
            "application_id": app_str,
            "opportunity_id": app_doc.get("opportunity_id"),
            "role_title": role_title,
            "company_name": company_name,
            "category": category_name,
            "difficulty": difficulty,
            "question_count": len(questions_snapshot),
            "is_timed": is_timed,
            "time_limit_minutes": time_limit_minutes,
            "started_at": started_at,
            "expires_at": expires_at,
            "submitted_at": None,
            "status": "in_progress",
            "questions": questions_snapshot,
            "submitted_answers": {},
            "score": 0,
            "percentage": 0.0,
            "total_questions": len(questions_snapshot),
            "correct_count": 0,
            "incorrect_count": 0,
            "unanswered_count": len(questions_snapshot),
            "topic_breakdown": {},
            "weak_topics": [],
            "recommended_revisions": []
        }

        created = MockTestAttemptModel.create_attempt(attempt_data)
        # Fetch full doc to format with server-authoritative timer
        doc = MockTestAttemptModel.find_by_id(created["id"], user_id=user_str)
        return cls._format_active_payload(doc)

    @classmethod
    def get_attempt(
        cls,
        application_id: str,
        attempt_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Retrieves attempt; enforces timer expiration and payload sanitation."""
        user_str = str(user_id)
        app_str = str(application_id)

        doc = MockTestAttemptModel.find_by_id(attempt_id, user_id=user_str, application_id=app_str)
        if not doc:
            raise ValueError("Mock test attempt not found")

        # Check expiration for in_progress tests
        if doc.get("status") == "in_progress" and doc.get("is_timed") and doc.get("expires_at"):
            now_dt = datetime.now(timezone.utc)
            try:
                exp_dt = datetime.fromisoformat(doc["expires_at"])
                if exp_dt.tzinfo is None:
                    exp_dt = exp_dt.replace(tzinfo=timezone.utc)
                if now_dt > exp_dt:
                    return cls._auto_expire_attempt(attempt_id, user_str)
            except Exception:
                pass

        if doc.get("status") == "in_progress":
            return cls._format_active_payload(doc)
        else:
            return MockTestAttemptModel.to_dict(doc, include_answers=True)

    @classmethod
    def save_answers(
        cls,
        application_id: str,
        attempt_id: str,
        user_id: str,
        answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Saves current answers without submitting. Rejects completed/expired tests."""
        user_str = str(user_id)
        app_str = str(application_id)

        doc = MockTestAttemptModel.find_by_id(attempt_id, user_id=user_str, application_id=app_str)
        if not doc:
            raise ValueError("Mock test attempt not found")

        if doc.get("status") != "in_progress":
            raise ValueError("Cannot edit answers for a completed or expired attempt")

        # Check deadline
        if doc.get("is_timed") and doc.get("expires_at"):
            now_dt = datetime.now(timezone.utc)
            exp_dt = datetime.fromisoformat(doc["expires_at"])
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            if now_dt > exp_dt:
                cls._auto_expire_attempt(attempt_id, user_str)
                raise ValueError("Test deadline has expired")

        # Merge with existing submitted_answers
        current_answers = doc.get("submitted_answers") or {}
        current_answers.update(answers)

        saved = MockTestAttemptModel.save_answers(attempt_id, user_str, current_answers)
        return {
            "success": saved,
            "saved_count": len(current_answers)
        }

    @classmethod
    def submit_attempt(
        cls,
        application_id: str,
        attempt_id: str,
        user_id: str,
        final_answers: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Grades test deterministically on the backend and records results.
        Idempotent: Repeated submissions return the existing result without altering score.
        """
        user_str = str(user_id)
        app_str = str(application_id)

        doc = MockTestAttemptModel.find_by_id(attempt_id, user_id=user_str, application_id=app_str)
        if not doc:
            raise ValueError("Mock test attempt not found")

        # If already completed or expired, return existing result idempotently
        if doc.get("status") in ("completed", "expired"):
            return MockTestAttemptModel.to_dict(doc, include_answers=True)

        # Merge any answers passed in the submission payload
        submitted = dict(doc.get("submitted_answers") or {})
        if final_answers and isinstance(final_answers, dict):
            submitted.update(final_answers)

        # Grade answers deterministically
        results_data = cls._grade_test(doc.get("questions") or [], submitted)
        results_data["submitted_answers"] = submitted

        # Check if deadline passed
        status = "completed"
        if doc.get("is_timed") and doc.get("expires_at"):
            now_dt = datetime.now(timezone.utc)
            exp_dt = datetime.fromisoformat(doc["expires_at"])
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            if now_dt > exp_dt:
                status = "expired"

        completed_dict = MockTestAttemptModel.complete_attempt(attempt_id, user_str, results_data, status=status)
        return completed_dict or MockTestAttemptModel.to_dict(doc, include_answers=True)

    @classmethod
    def list_previous_attempts(
        cls,
        application_id: str,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Returns student's historical test attempts for this application."""
        user_str = str(user_id)
        app_str = str(application_id)

        # Verify application ownership
        app_doc = ApplicationModel.find_by_id(app_str, user_id=user_str)
        if not app_doc:
            raise ValueError("Application not found or unauthorized")

        return MockTestAttemptModel.find_by_application(app_str, user_str)

    @classmethod
    def add_weak_topic_to_roadmap(
        cls,
        application_id: str,
        attempt_id: str,
        user_id: str,
        topic_name: str
    ) -> Dict[str, Any]:
        """Appends a weak topic revision task to the application's preparation checklist roadmap."""
        user_str = str(user_id)
        app_str = str(application_id)

        doc = MockTestAttemptModel.find_by_id(attempt_id, user_id=user_str, application_id=app_str)
        if not doc:
            raise ValueError("Mock test attempt not found")

        from app.services.interview_prep_service import InterviewPrepService
        updated_pack = InterviewPrepService.add_skill_to_roadmap(
            user_id=user_str,
            application_id=app_str,
            skill_name=topic_name
        )
        return updated_pack

    # -------------------------------------------------------------------------
    # Internal Helpers
    # -------------------------------------------------------------------------

    @classmethod
    def _format_active_payload(cls, doc: dict) -> Dict[str, Any]:
        """Formats active attempt payload, stripping answers and calculating remaining seconds."""
        payload = MockTestAttemptModel.to_dict(doc, include_answers=False)
        remaining_seconds = None
        if doc.get("is_timed") and doc.get("expires_at"):
            now_dt = datetime.now(timezone.utc)
            exp_dt = datetime.fromisoformat(doc["expires_at"])
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            diff = (exp_dt - now_dt).total_seconds()
            remaining_seconds = max(0, int(diff))

        payload["remaining_seconds"] = remaining_seconds
        return payload

    @classmethod
    def _auto_expire_attempt(cls, attempt_id: str, user_id: str) -> Dict[str, Any]:
        """Grades whatever was submitted up to expiration time and marks expired."""
        doc = MockTestAttemptModel.find_by_id(attempt_id, user_id=user_id)
        if not doc or doc.get("status") != "in_progress":
            return MockTestAttemptModel.to_dict(doc, include_answers=True) if doc else {}

        submitted = doc.get("submitted_answers") or {}
        results_data = cls._grade_test(doc.get("questions") or [], submitted)
        results_data["submitted_answers"] = submitted
        return MockTestAttemptModel.complete_attempt(attempt_id, user_id, results_data, status="expired")

    @classmethod
    def _grade_test(
        cls,
        questions: List[Dict[str, Any]],
        submitted_answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Deterministic objective grading engine.
        Calculates correct, incorrect, unanswered counts, score, percentage,
        topic-level breakdown, and actionable revision recommendations.
        """
        total = len(questions)
        correct_count = 0
        incorrect_count = 0
        unanswered_count = 0

        topic_stats: Dict[str, Dict[str, int]] = {}

        for q in questions:
            q_id = q["id"]
            topic = q.get("topic") or q.get("category") or "General"
            if topic not in topic_stats:
                topic_stats[topic] = {"total": 0, "correct": 0}
            topic_stats[topic]["total"] += 1

            user_ans = submitted_answers.get(q_id)
            correct_ans = q.get("correct_answer")

            if user_ans is None or str(user_ans).strip() == "":
                unanswered_count += 1
            else:
                user_clean = str(user_ans).strip().lower()
                corr_clean = str(correct_ans).strip().lower() if correct_ans else ""
                if user_clean == corr_clean:
                    correct_count += 1
                    topic_stats[topic]["correct"] += 1
                else:
                    incorrect_count += 1

        percentage = round((correct_count / total) * 100, 1) if total > 0 else 0.0

        # Topic Breakdown
        topic_breakdown = {}
        weak_topics = []
        for top, stats in topic_stats.items():
            top_total = stats["total"]
            top_corr = stats["correct"]
            top_pct = round((top_corr / top_total) * 100, 1) if top_total > 0 else 0.0
            topic_breakdown[top] = {
                "total": top_total,
                "correct": top_corr,
                "percentage": top_pct
            }
            # Topic is weak if accuracy is below 70%
            if top_pct < 70.0:
                weak_topics.append(top)

        # Recommended Revisions mapped to verified resources
        recommended_revisions = []
        for wt in weak_topics:
            matched_res = get_resources_by_skill(wt)
            rec_item = {
                "topic": wt,
                "reason": f"Scored below 70% in {wt} during mock test.",
                "suggested_action": f"Review core documentation and complete hands-on practice for {wt}.",
                "resources": matched_res[:2] if matched_res else []
            }
            recommended_revisions.append(rec_item)

        return {
            "score": correct_count,
            "percentage": percentage,
            "total_questions": total,
            "correct_count": correct_count,
            "incorrect_count": incorrect_count,
            "unanswered_count": unanswered_count,
            "topic_breakdown": topic_breakdown,
            "weak_topics": weak_topics,
            "recommended_revisions": recommended_revisions
        }
