import logging
import os
import re
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

from app.models.application import ApplicationModel
from app.models.profile import ProfileModel
from app.models.interview_prep import InterviewPrepModel
from app.models.interview_session import InterviewSessionModel
from app.models.mock_test_attempt import MockTestAttemptModel
from app.services.interview_prep_service import InterviewPrepService
from app.services.resource_catalog import get_resources_by_skill
from app.ai.ai_service import AIService

logger = logging.getLogger(__name__)

SIMULATOR_DISCLAIMER = (
    "This AI interview simulator is an interactive practice environment grounded in your candidate profile, "
    "projects, and application job description. Evaluative feedback, score bands, and sample answers are provided "
    "as study aids for self-improvement and do not constitute hiring decisions or official interview guarantees."
)

class InterviewSimulatorService:
    """
    Production-ready service managing grounded, interactive AI interview simulator sessions,
    contextual answer evaluations, and readiness analytics for student job applications.
    """

    @classmethod
    def get_supported_modes(cls) -> List[Dict[str, Any]]:
        return [
            {
                "id": "technical",
                "name": "Technical Interview",
                "description": "Job-specific technical questions covering required technologies, frameworks, and core engineering fundamentals.",
                "icon": "Cpu",
                "default_questions": 5
            },
            {
                "id": "coding_discussion",
                "name": "Coding & Problem Solving",
                "description": "Algorithmic reasoning, time/space complexity analysis, edge cases, debugging, and database query architecture.",
                "icon": "Code",
                "default_questions": 5
            },
            {
                "id": "project_deep_dive",
                "name": "Project Deep-Dive",
                "description": "In-depth discussion grounded directly in your verified student projects, architecture, challenges, and trade-offs.",
                "icon": "Layers",
                "default_questions": 5
            },
            {
                "id": "behavioral",
                "name": "Behavioral & HR (STAR)",
                "description": "Scenario-based behavioral questions evaluated using the STAR framework (Situation, Task, Action, Result).",
                "icon": "Users",
                "default_questions": 5
            },
            {
                "id": "weak_topics",
                "name": "Weak-Topic Revision",
                "description": "Targeted practice focusing on topics where you missed questions in mock tests or have priority skill gaps.",
                "icon": "Target",
                "default_questions": 5
            }
        ]

    # -------------------------------------------------------------------------
    # Session Lifecycle: Start / Retrieve / List
    # -------------------------------------------------------------------------

    @classmethod
    def start_session(
        cls,
        app_id: str,
        user_id: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Starts a new interview simulation session or resumes an existing active session.
        Grounded in target role, job description, student projects, and existing question bank.
        """
        user_str = str(user_id)
        app_str = str(app_id)
        config = config or {}

        # 1. Verify application ownership
        application = ApplicationModel.find_by_id(app_str, user_id=user_str)
        if not application:
            raise ValueError("Application not found or unauthorized")

        resume_active = config.get("resume_active", True)
        if resume_active:
            active_session = InterviewSessionModel.find_active(user_str, app_str)
            if active_session:
                # If requested mode matches or user did not specify new mode, resume
                requested_mode = config.get("mode") or config.get("session_type")
                if not requested_mode or active_session.get("mode") == requested_mode:
                    return active_session

        # 2. Resolve session parameters
        mode = (config.get("mode") or config.get("session_type") or "technical").lower().strip()
        if mode not in InterviewSessionModel.MODES:
            mode = "technical"

        difficulty = (config.get("difficulty") or "medium").lower().strip()
        if difficulty not in InterviewSessionModel.DIFFICULTIES:
            difficulty = "medium"

        total_questions = max(1, min(int(config.get("question_count", 5)), 20))

        # 3. Fetch candidate context and preparation pack
        prep_pack = InterviewPrepService.get_or_generate_prep_pack(user_str, app_str, force_refresh=False)
        profile = ProfileModel.find_by_user_id(user_str) or {}

        # 4. Generate / curate grounded questions for the requested mode
        questions = cls._curate_grounded_questions(
            mode=mode,
            difficulty=difficulty,
            count=total_questions,
            application=application,
            prep_pack=prep_pack,
            profile=profile
        )

        # 5. Create session document
        session_data = {
            "user_id": user_str,
            "application_id": app_str,
            "mode": mode,
            "session_type": mode,
            "difficulty": difficulty,
            "total_questions": len(questions),
            "current_question_index": 0,
            "questions": questions,
            "answers": {},
            "evaluations": {},
            "follow_up_answers": {},
            "prep_pack_id": prep_pack.get("id"),
            "target_role": application.get("role") or prep_pack.get("role_title", "Candidate Role"),
            "company_name": application.get("company") or prep_pack.get("company_name", "Target Company"),
            "disclaimer": SIMULATOR_DISCLAIMER
        }

        return InterviewSessionModel.create_session(session_data)

    @classmethod
    def get_session(cls, app_id: str, session_id: str, user_id: str) -> Dict[str, Any]:
        """Retrieves an owned session by ID."""
        session = InterviewSessionModel.find_by_id(session_id, user_id=str(user_id), app_id=str(app_id))
        if not session:
            raise ValueError("Interview session not found or unauthorized")
        return session

    @classmethod
    def get_active_session(cls, app_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves currently active or paused session for this application."""
        return InterviewSessionModel.find_active(str(user_id), str(app_id))

    @classmethod
    def list_sessions(cls, app_id: str, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Lists historical simulation sessions for this application."""
        return InterviewSessionModel.list_by_application(str(app_id), str(user_id), limit=limit)

    # -------------------------------------------------------------------------
    # Answer Submission & AI Evaluation
    # -------------------------------------------------------------------------

    @classmethod
    def submit_answer(
        cls,
        app_id: str,
        session_id: str,
        user_id: str,
        question_index: int,
        answer_text: str
    ) -> Dict[str, Any]:
        """
        Submits a candidate's answer for evaluation.
        Atomically saves the response to avoid loss if AI provider times out.
        """
        user_str = str(user_id)
        app_str = str(app_id)

        session = InterviewSessionModel.find_by_id(session_id, user_id=user_str, app_id=app_str)
        if not session:
            raise ValueError("Session not found or unauthorized")

        if session.get("status") in ("completed", "ended_early"):
            raise ValueError("This interview session has already ended")

        questions = session.get("questions") or []
        if question_index < 0 or question_index >= len(questions):
            raise ValueError(f"Invalid question index: {question_index}")

        # Clean and bound student answer (minimum 5 chars, maximum 5000 chars)
        clean_answer = str(answer_text or "").strip()
        if len(clean_answer) < 5:
            raise ValueError("Answer is too short. Please provide a substantive response (at least 5 characters).")
        clean_answer = clean_answer[:5000]

        # 1. ATOMIC PERSISTENCE: Save answer immediately before invoking AI
        saved = InterviewSessionModel.save_answer(session_id, user_str, question_index, clean_answer)
        if not saved:
            raise RuntimeError("Could not persist answer to database")

        # 2. Evaluate answer using AIService or grounded fallback
        current_q = questions[question_index]
        role_title = session.get("target_role") or "Candidate Role"
        company_name = session.get("company_name") or "Hiring Team"
        mode = session.get("mode") or "technical"

        evaluation = cls._evaluate_answer(
            question=current_q,
            answer_text=clean_answer,
            role_title=role_title,
            company_name=company_name,
            mode=mode
        )

        # 3. Persist evaluation
        InterviewSessionModel.save_evaluation(session_id, user_str, question_index, evaluation)

        return {
            "session_id": session_id,
            "question_index": question_index,
            "answer_text": clean_answer,
            "evaluation": evaluation
        }

    @classmethod
    def advance_to_next_question(
        cls,
        app_id: str,
        session_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Moves session forward to the next question.
        If all questions have been answered, completes session and builds final summary.
        """
        user_str = str(user_id)
        app_str = str(app_id)

        session = InterviewSessionModel.find_by_id(session_id, user_id=user_str, app_id=app_str)
        if not session:
            raise ValueError("Session not found or unauthorized")

        curr_idx = session.get("current_question_index", 0)
        total_q = session.get("total_questions", len(session.get("questions") or []))

        next_idx = curr_idx + 1

        if next_idx >= total_q:
            # Session complete! Build summary
            summary = cls._compute_session_summary(session)
            updated = InterviewSessionModel.complete_session(session_id, user_str, summary, status="completed")
            return updated or session
        else:
            InterviewSessionModel.advance_question(session_id, user_str, next_idx)
            return cls.get_session(app_str, session_id, user_str)

    @classmethod
    def pause_session(cls, app_id: str, session_id: str, user_id: str) -> Dict[str, Any]:
        """Pauses active session."""
        success = InterviewSessionModel.pause_session(session_id, str(user_id))
        if not success:
            raise ValueError("Could not pause session")
        return cls.get_session(app_id, session_id, user_id)

    @classmethod
    def resume_session(cls, app_id: str, session_id: str, user_id: str) -> Dict[str, Any]:
        """Resumes paused session."""
        success = InterviewSessionModel.resume_session(session_id, str(user_id))
        if not success:
            raise ValueError("Could not resume session")
        return cls.get_session(app_id, session_id, user_id)

    @classmethod
    def end_session_early(cls, app_id: str, session_id: str, user_id: str) -> Dict[str, Any]:
        """Ends active session early and records available progress."""
        user_str = str(user_id)
        session = cls.get_session(app_id, session_id, user_str)
        summary = cls._compute_session_summary(session)
        updated = InterviewSessionModel.complete_session(session_id, user_str, summary, status="ended_early")
        return updated or session

    # -------------------------------------------------------------------------
    # Roadmap Integration: Add Simulator Weakness to Prep Checklist
    # -------------------------------------------------------------------------

    @classmethod
    def add_feedback_to_roadmap(
        cls,
        app_id: str,
        session_id: str,
        user_id: str,
        task_title: str,
        category: str = "Technical"
    ) -> Dict[str, Any]:
        """
        Adds a revision item identified during the interview session to the preparation checklist.
        """
        user_str = str(user_id)
        app_str = str(app_id)

        prep_pack = InterviewPrepModel.find_by_application(app_str, user_str)
        if not prep_pack:
            prep_pack = InterviewPrepService.get_or_generate_prep_pack(user_str, app_str)

        clean_title = (task_title or "").strip()
        if not clean_title:
            raise ValueError("Task title cannot be empty")

        checklist = prep_pack.get("checklist") or []
        task_id = f"sim_task_{int(datetime.now(timezone.utc).timestamp())}"

        # Prevent duplicate tasks with identical name
        if not any(item.get("task", "").lower() == clean_title.lower() for item in checklist):
            checklist.append({
                "id": task_id,
                "task": clean_title,
                "category": category,
                "completed": False,
                "source": "interview_simulator",
                "session_id": session_id
            })

            prep_pack["checklist"] = checklist
            updated = InterviewPrepModel.save_prep_pack(user_str, app_str, prep_pack)
            return updated

        return prep_pack

    # -------------------------------------------------------------------------
    # Internal: Question Selection by Mode
    # -------------------------------------------------------------------------

    @classmethod
    def _curate_grounded_questions(
        cls,
        mode: str,
        difficulty: str,
        count: int,
        application: Dict[str, Any],
        prep_pack: Dict[str, Any],
        profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Curates grounded questions based on mode, candidate projects, and existing question bank.
        """
        existing_bank = prep_pack.get("question_bank") or []
        role_title = application.get("role") or prep_pack.get("role_title", "Software Engineer")
        company_name = application.get("company") or prep_pack.get("company_name", "Target Company")
        projects = profile.get("projects") or []

        selected: List[Dict[str, Any]] = []

        if mode == "technical":
            # Prefer Technical Fundamentals and Job-Specific Technologies
            candidates = [
                q for q in existing_bank
                if q.get("category") in ("Technical Fundamentals", "Job-Specific Technologies")
            ]
            selected.extend(candidates[:count])

        elif mode == "coding_discussion":
            # Prefer Coding and DSA, SQL and Databases
            candidates = [
                q for q in existing_bank
                if q.get("category") in ("Coding and DSA", "SQL and Databases")
            ]
            selected.extend(candidates[:count])

        elif mode == "project_deep_dive":
            # Grounded directly in student projects
            if projects:
                for idx, proj in enumerate(projects[:count]):
                    p_name = proj.get("name") or proj.get("title") or f"Project {idx + 1}"
                    p_tech = ", ".join(proj.get("technologies") or proj.get("tech_stack") or ["standard web technologies"])
                    p_desc = proj.get("description") or "a production application"

                    selected.append({
                        "id": f"sim_proj_{idx + 1}",
                        "category": "Project Deep-Dive",
                        "difficulty": difficulty.capitalize(),
                        "question_text": (
                            f"In your project '{p_name}', you utilized {p_tech}. "
                            f"Walk me through the end-to-end architecture: what were the critical bottlenecks you encountered, "
                            f"how did you handle error boundaries and state persistence, and what architectural trade-off would you reconsider if rebuilding it today?"
                        ),
                        "why_relevant": f"Evaluates your practical engineering rigor, ownership, and design decisions on '{p_name}'.",
                        "expected_points": [
                            f"High-level architecture breakdown for '{p_name}' (client, server, database, third-party APIs).",
                            "Specific bottlenecks encountered (latency, concurrency, schema design, memory, cold starts).",
                            "Concrete trade-offs analyzed (e.g. SQL vs NoSQL, client vs server rendering, polling vs WebSockets).",
                            "Demonstrated testing, monitoring, and retrospective lessons learned."
                        ],
                        "sample_outline": (
                            f"Start with a 60-second architecture elevator pitch of {p_name}. "
                            "Highlight the database choices and API patterns. Then explain an actual engineering challenge you hit in production or testing, "
                            "how you isolated root cause, and how you verified your fix."
                        ),
                        "common_mistakes": [
                            "Speaking only about UI features without discussing architectural trade-offs.",
                            "Claiming a project had zero bottlenecks or trade-offs.",
                            "Failing to mention how security or data consistency was maintained."
                        ],
                        "learning_resources": get_resources_by_skill("System Design")[:2],
                        "grounded_source": f"Candidate Project: {p_name}"
                    })
            else:
                # If no projects in profile, ask a realistic design question grounded in the role
                selected.append({
                    "id": "sim_proj_fallback",
                    "category": "Project Deep-Dive",
                    "difficulty": difficulty.capitalize(),
                    "question_text": (
                        f"Describe a complex software project or system you contributed to that is relevant to {role_title}. "
                        "What was your individual technical ownership, how did you choose the technology stack, and what failure modes did you design against?"
                    ),
                    "why_relevant": f"Demonstrates your ability to articulate technical systems relevant to {role_title}.",
                    "expected_points": [
                        "Clear scope and individual technical ownership.",
                        "Justification for key technology choices over alternatives.",
                        "Failure mode handling and defensive programming patterns."
                    ],
                    "sample_outline": "Define project scope -> System architecture -> Specific challenges -> Measurable outcome.",
                    "common_mistakes": ["Vague team contributions", "No architectural rationale"],
                    "learning_resources": get_resources_by_skill("System Design")[:2],
                    "grounded_source": "Role Requirements"
                })

        elif mode == "behavioral":
            # STAR Behavioral questions
            candidates = [
                q for q in existing_bank
                if q.get("category") == "Behavioral and HR Questions"
            ]
            selected.extend(candidates[:count])

        elif mode == "weak_topics":
            # Grounded in priority skill gaps and mock test attempts
            priority_gaps = prep_pack.get("skill_gaps", {}).get("priority_gaps") or []
            gap_skills = [g.get("skill_name") for g in priority_gaps if g.get("skill_name")]

            # Look up past mock test weak topics
            attempts = MockTestAttemptModel.get_attempts_for_application(application.get("id", ""))
            weak_topics_from_tests = []
            for att in attempts:
                for topic in att.get("weak_topics", []):
                    if topic not in weak_topics_from_tests:
                        weak_topics_from_tests.append(topic)

            combined_weak_topics = list(dict.fromkeys(weak_topics_from_tests + gap_skills))

            if combined_weak_topics:
                for idx, topic in enumerate(combined_weak_topics[:count]):
                    selected.append({
                        "id": f"sim_weak_{idx + 1}",
                        "category": "Weak-Topic Revision",
                        "difficulty": difficulty.capitalize(),
                        "question_text": (
                            f"During your recent assessments, '{topic}' was highlighted as an area for improvement. "
                            f"How would you explain the core concepts of {topic} to a junior engineer, and how do you apply it safely in production?"
                        ),
                        "why_relevant": f"Targeted revision on '{topic}' based on your diagnostic mock tests and role skill gaps.",
                        "expected_points": [
                            f"Precise definition and core principles of {topic}.",
                            "Standard production use cases and common antipatterns.",
                            "Best practices for testing and monitoring {topic} in a live environment."
                        ],
                        "sample_outline": f"Core definition -> Architecture impact -> Common antipattern to avoid -> Production safety.",
                        "common_mistakes": ["Surface-level definitions without operational context"],
                        "learning_resources": get_resources_by_skill(topic)[:2],
                        "grounded_source": f"Diagnostic Focus: {topic}"
                    })

        # Blend in questions directly synthesized from the candidate's verified Resume and Job Description
        synth_count = min(count, 4)
        synthetic = cls._synthesize_jd_and_resume_questions(
            application=application,
            profile=profile,
            prep_pack=prep_pack,
            count=synth_count,
            difficulty=difficulty,
            mode=mode,
            existing_count=len(selected)
        )
        selected.extend(synthetic)

        # Fill remaining slots from existing question bank if needed
        if len(selected) < count:
            remaining = [q for q in existing_bank if q.get("id") not in [s.get("id") for s in selected]]
            selected.extend(remaining[:(count - len(selected))])

        # If still fewer questions than requested (e.g. student asked for 10-15 questions),
        # synthesize additional rich questions deeply grounded in Job Description and student's verified Resume
        if len(selected) < count:
            needed = count - len(selected)
            more_synthetic = cls._synthesize_jd_and_resume_questions(
                application=application,
                profile=profile,
                prep_pack=prep_pack,
                count=needed,
                difficulty=difficulty,
                mode=mode,
                existing_count=len(selected)
            )
            selected.extend(more_synthetic)

        # Standardize question format
        standardized = []
        for idx, q in enumerate(selected[:count]):
            q_id = q.get("id") or f"sim_q_{idx + 1}"
            q_text = q.get("question_text") or q.get("question") or q.get("prompt") or "Technical Question"

            grounded_src = q.get("grounded_source")
            if not grounded_src or grounded_src == "Role Preparation Pack":
                category = q.get("category", "")
                if "Job-Specific" in category or "Role" in category:
                    grounded_src = "Job Description Requirements"
                elif "DSA" in category or "Coding" in category:
                    grounded_src = "Technical Problem Solving & Resume Foundations"
                elif "Behavioral" in category or "HR" in category:
                    grounded_src = "Behavioral & Student Experience"
                elif "Project" in category:
                    grounded_src = "Verified Candidate Projects"
                else:
                    grounded_src = "Job Description & Student Profile"

            standardized.append({
                "id": q_id,
                "category": q.get("category", "Technical Practice"),
                "difficulty": q.get("difficulty", difficulty.capitalize()),
                "question_text": q_text,
                "why_relevant": q.get("why_relevant", f"Assesses competencies required for {role_title} at {company_name}."),
                "expected_points": q.get("expected_points") or q.get("expected_answer_points") or [
                    "Clarity of conceptual explanation.",
                    "Correct application to software architecture.",
                    "Discussion of trade-offs and edge cases."
                ],
                "sample_outline": q.get("sample_outline") or q.get("sample_answer") or "Structure your answer: Definition -> Application -> Trade-offs.",
                "common_mistakes": q.get("common_mistakes") or ["Vague definitions", "Lack of practical examples"],
                "learning_resources": q.get("learning_resources") or [],
                "grounded_source": grounded_src
            })

        return standardized

    @classmethod
    def _synthesize_jd_and_resume_questions(
        cls,
        application: Dict[str, Any],
        profile: Dict[str, Any],
        prep_pack: Dict[str, Any],
        count: int,
        difficulty: str,
        mode: str,
        existing_count: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Synthesizes substantive questions deeply grounded in both the Application's Job Description
        and the Candidate's verified Resume/Profile (projects, skills, past experience).
        """
        role_title = application.get("role") or prep_pack.get("role_title", "Software Engineer")
        company_name = application.get("company") or prep_pack.get("company_name", "Target Company")
        jd_text = application.get("job_description") or application.get("notes") or ""

        # Extract resume skills
        raw_skills = profile.get("skills") or []
        skills_list = []
        for s in raw_skills:
            if isinstance(s, dict):
                skills_list.append(s.get("name") or s.get("skill") or "")
            elif isinstance(s, str):
                skills_list.append(s)
        skills_list = [s.strip() for s in skills_list if s.strip()]
        if not skills_list:
            skills_list = ["System Architecture", "RESTful APIs", "Relational Databases", "Concurrency", "Testing"]

        # Extract resume projects
        projects = profile.get("projects") or []
        project_names = [p.get("name") or p.get("title") or "Production Project" for p in projects if isinstance(p, dict)]
        if not project_names:
            project_names = ["Full-Stack Web Platform", "Distributed Microservices API"]

        # Extract candidate experiences
        experiences = profile.get("experience") or []
        exp_roles = [e.get("title") or e.get("role") or "Engineering Role" for e in experiences if isinstance(e, dict)]

        # Extract priority skill gaps
        priority_gaps = prep_pack.get("skill_gaps", {}).get("priority_gaps") or []
        gap_names = [g.get("skill_name") for g in priority_gaps if g.get("skill_name")]

        pool: List[Dict[str, Any]] = []

        # 1. JD & Resume Technical Architecture Question
        primary_skill = skills_list[0] if skills_list else "Data Structures"
        secondary_skill = skills_list[1] if len(skills_list) > 1 else "Database Indexing"
        primary_proj = project_names[0] if project_names else "Portfolio Application"

        pool.append({
            "id": f"sim_syn_{existing_count + 1}",
            "category": "Technical Architecture",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"The job description for {role_title} at {company_name} emphasizes scalable backend systems, "
                f"while your resume highlights practical experience with {primary_skill}. "
                f"If you were architecting an API service for {company_name} that processes 50,000 requests per minute using {primary_skill}, "
                "how would you design the database connection pooling, caching invalidation strategy, and circuit breaker patterns to prevent cascading failures?"
            ),
            "why_relevant": f"Tests how your verified skill in {primary_skill} maps directly to {company_name}'s production workload requirements.",
            "expected_points": [
                f"Connection pooling mechanics and sizing for {primary_skill} backends.",
                "Cache invalidation approaches (Cache-Aside, Write-Through) and TTL strategies.",
                "Circuit breaker thresholds (failure rate, cooldown window, fallback responses).",
                "Observability metrics (p99 latency, queue depth, error budgets)."
            ],
            "sample_outline": (
                "1. High-Level Topology: API Gateway -> Load Balancer -> Service Cluster -> Read Replicas.\n"
                "2. Caching Tier: Redis cluster with consistent hashing and write-through cache.\n"
                "3. Resiliency: Exponential backoff with jitter and circuit breaker.\n"
                "4. Monitoring: Prometheus histograms tracking p95/p99 request latencies."
            ),
            "common_mistakes": ["Focusing only on happy-path code without error boundaries", "Ignoring cache thundering herd risks"],
            "learning_resources": get_resources_by_skill("System Design")[:2],
            "grounded_source": f"Job Description & Resume ({primary_skill})"
        })

        # 2. Candidate Project Deep-Dive & Code Reliability Question
        pool.append({
            "id": f"sim_syn_{existing_count + 2}",
            "category": "Project Deep-Dive",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"In your resume project '{primary_proj}', walk me through how you implemented automated testing and code validation. "
                f"What unit, integration, and contract tests did you write, what was your strategy for mocking external third-party dependencies, "
                "and what failure mode in that project surprised you most during testing?"
            ),
            "why_relevant": f"Verifies engineering rigor and truthful project ownership on your resume project '{primary_proj}'.",
            "expected_points": [
                f"Testing pyramid allocation on '{primary_proj}' (Unit vs Integration vs E2E).",
                "Deterministic test fixture management and test database containerization.",
                "Specific edge cases or race conditions discovered and fixed.",
                "Continuous integration setup and regression test enforcement."
            ],
            "sample_outline": (
                "1. Testing Architecture: Isolated unit test suites and ephemeral Docker database fixtures.\n"
                "2. Mocking Strategy: Interface abstractions over external network calls.\n"
                "3. Real Incident: A race condition during concurrent writes and how transaction isolation fixed it.\n"
                "4. Outcome: Zero unhandled 500 regressions in subsequent feature releases."
            ),
            "common_mistakes": ["Saying 'everything worked smoothly without bugs'", "Confusing unit tests with manual browser testing"],
            "learning_resources": get_resources_by_skill("Testing")[:2],
            "grounded_source": f"Verified Resume Project: {primary_proj}"
        })

        # 3. Database Performance & Query Optimization (JD + Resume)
        pool.append({
            "id": f"sim_syn_{existing_count + 3}",
            "category": "Databases & Performance",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"At {company_name}, query performance and transaction safety are essential for the {role_title} role. "
                f"Using {secondary_skill} from your resume background, describe how you diagnose a slow SQL query in a production environment. "
                "How do you inspect the execution plan, when should you avoid adding a B-Tree index, and how do you handle locking contention during high-write periods?"
            ),
            "why_relevant": f"Assesses database maturity required for {role_title} applications.",
            "expected_points": [
                "Inspection of EXPLAIN ANALYZE execution plan (sequential scans, hash joins, nested loops).",
                "Index selectivity trade-offs: write amplification, memory footprint, low cardinality columns.",
                "Lock contention mitigation: optimistic locking, row-level locks, reducing transaction scopes.",
                "Read-replica routing for heavy reporting queries."
            ],
            "sample_outline": (
                "1. Diagnosis: Slow query logs, pg_stat_statements / APM trace.\n"
                "2. Execution Plan: Checking scan types, index hits, filter selectivity.\n"
                "3. Indexing Decision: Adding composite index with proper column ordering.\n"
                "4. Concurrency Safety: Short transaction windows to avoid deadlocks."
            ),
            "common_mistakes": ["Suggesting to index every column in the table", "Ignoring write throughput degradation caused by excess indexes"],
            "learning_resources": get_resources_by_skill("SQL")[:2],
            "grounded_source": f"JD Performance Requirements & {secondary_skill}"
        })

        # 4. Behavioral & Team Collaboration (STAR Grounded in Experience)
        team_ctx = f"in your previous work as {exp_roles[0]}" if exp_roles else "during your collaborative university or open-source projects"
        pool.append({
            "id": f"sim_syn_{existing_count + 4}",
            "category": "Behavioral (STAR)",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"Tell me about a time {team_ctx} where you and a colleague strongly disagreed on a software architecture or technology choice. "
                "Using the STAR framework, explain the Situation, the Task you needed to deliver, the Actions you took to evaluate options objectively, "
                "and the ultimate Result on project timeline and team morale."
            ),
            "why_relevant": f"Demonstrates interpersonal maturity, constructive debate, and delivery mindset required for {company_name}.",
            "expected_points": [
                "Situation: Clear project context, technical requirements, and stakes.",
                "Task: The specific architectural decision that created division.",
                "Action: Data-driven comparison (benchmarks, spike prototype, RFC discussion) rather than subjective argument.",
                "Result: Quantifiable project outcome, timely delivery, and positive professional relationship."
            ],
            "sample_outline": (
                "Situation: Two competing approaches for real-time messaging.\n"
                "Task: Select a protocol that met latency SLAs without inflating operational complexity.\n"
                "Action: Built a 1-day benchmark spike comparing throughput and memory consumption.\n"
                "Result: Agreed on the benchmarked solution, shipped on schedule, documented the decision in an ADR."
            ),
            "common_mistakes": ["Blaming the colleague", "Describing a compromise that satisfied nobody and broke code"],
            "learning_resources": get_resources_by_skill("Communication")[:2],
            "grounded_source": "Behavioral STAR & Team Collaboration"
        })

        # 5. Security, Authentication & Least Privilege
        pool.append({
            "id": f"sim_syn_{existing_count + 5}",
            "category": "Security & Governance",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"Security and data privacy are critical across all services at {company_name}. "
                f"Walk me through how you design secure authentication and authorization for {role_title}. "
                "How do you store credentials, handle JWT revocation, prevent Cross-Site Scripting (XSS) and CSRF attacks, "
                "and protect against Broken Object Level Authorization (BOLA)?"
            ),
            "why_relevant": "Evaluates defensive programming, OWASP Top 10 awareness, and compliance for production systems.",
            "expected_points": [
                "Password hashing using Argon2 or bcrypt with work factor salt.",
                "Token storage strategy: HTTP-only, Secure, SameSite cookies vs localStorage vulnerabilities.",
                "BOLA prevention: Validating user ownership on every database query rather than trusting route parameter IDs.",
                "Rate limiting and brute force protection on auth endpoints."
            ],
            "sample_outline": (
                "1. Credential Security: Argon2id hashing with per-user salt.\n"
                "2. Session Management: Short-lived access token + rotating refresh token stored in HTTP-only cookies.\n"
                "3. API Authorization: Tenant & User ID assertion on database operations.\n"
                "4. Defense-in-Depth: Input validation, parameterized queries, and strict CORS policies."
            ),
            "common_mistakes": ["Storing raw JWTs in localStorage without XSS protection", "Trusting client-supplied user IDs without session verification"],
            "learning_resources": get_resources_by_skill("Security")[:2],
            "grounded_source": "Production Security & OWASP Standards"
        })

        # 6. Concurrency, Race Conditions & Distributed Transactions
        pool.append({
            "id": f"sim_syn_{existing_count + 6}",
            "category": "Concurrency & Distributed Systems",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"Imagine two users simultaneously attempt to claim the last available ticket or update the same balance in {company_name}'s system. "
                "How would you prevent double-spending or race conditions? Explain optimistic locking versus pessimistic locking, "
                "idempotency keys, and when you would use distributed locks (such as Redis Redlock) versus database constraints."
            ),
            "why_relevant": f"Crucial for {role_title} engineers dealing with concurrent transactions and financial/order integrity.",
            "expected_points": [
                "Mechanics of race condition under concurrent read-modify-write.",
                "Optimistic locking using version column (UPDATE ... WHERE id = x AND version = v).",
                "Pessimistic locking with SELECT ... FOR UPDATE and its deadlock caveats.",
                "Idempotency keys in distributed payments / writes."
            ],
            "sample_outline": (
                "1. Problem Definition: The concurrent read-modify-write hazard.\n"
                "2. Database Solution: Versioned optimistic locking for low-contention rows.\n"
                "3. High-Contention Strategy: Redis atomic DECR or queue serialization.\n"
                "4. Idempotency: Hashing request payload with client-supplied UUID."
            ),
            "common_mistakes": ["Relying on in-memory application mutexes across multi-instance server deployments", "Failing to handle optimistic lock retry exhaustion"],
            "learning_resources": get_resources_by_skill("System Design")[:2],
            "grounded_source": "High-Concurrency Engineering"
        })

        # 7. Production Debugging & Incident Triage
        pool.append({
            "id": f"sim_syn_{existing_count + 7}",
            "category": "DevOps & Production Triage",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"It is 2:00 PM on a weekday, and customer alerts for {company_name} report intermittent 504 Gateway Timeouts "
                f"on the main API deployed for {role_title}. Walk me through your step-by-step triage process. "
                "How do you isolate the blast radius, correlate metrics and logs, determine whether to rollback or hotfix, "
                "and what post-mortem actions do you document?"
            ),
            "why_relevant": "Evaluates operational maturity, poise under pressure, and systematic debugging capability.",
            "expected_points": [
                "Immediate mitigation first: health check verification, traffic shedding, or zero-downtime rollback.",
                "Telemetry correlation: Grafana / APM dashboards (p99 latency, CPU, memory, downstream database locks).",
                "Log aggregation: Searching for error spikes and traceback patterns across distributed request traces.",
                "Blameless post-mortem: Root cause analysis, timeline, action items, and prevention tests."
            ],
            "sample_outline": (
                "1. Assess Blast Radius & Communicate: Acknowledge incident, verify affected customer percentage.\n"
                "2. Stop the Bleeding: Immediate rollback if correlated with a recent release.\n"
                "3. Root Cause Investigation: Inspect connection pools, memory leaks, or unindexed slow queries.\n"
                "4. Blameless Post-Mortem: Write 5-Whys summary and add automated canary deployment checks."
            ),
            "common_mistakes": ["Panicking and attempting live untested changes directly in production database", "Focusing on blame rather than system resilience"],
            "learning_resources": get_resources_by_skill("DevOps")[:2],
            "grounded_source": "Production Incident Management"
        })

        # 8. API Design & Versioning Strategy
        pool.append({
            "id": f"sim_syn_{existing_count + 8}",
            "category": "API Architecture",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"When designing RESTful and GraphQL APIs for {role_title} at {company_name}, "
                "how do you design for backward compatibility? How do you implement semantic versioning, "
                "cursor-based pagination for large datasets, and rate limiting to protect internal microservices?"
            ),
            "why_relevant": f"Demonstrates clean software contracts and sustainable API architecture for {company_name}.",
            "expected_points": [
                "URI versioning (/v1/) vs Header-based content negotiation.",
                "Cursor pagination (keyset pagination) benefits over OFFSET/LIMIT for large tables.",
                "Token bucket or Leaky bucket algorithms for API rate limiting.",
                "Graceful deprecation headers and sunset timelines."
            ],
            "sample_outline": (
                "1. Versioning: Additive field changes without breaking existing JSON schemas.\n"
                "2. Keyset Pagination: WHERE (created_at, id) < (cursor_time, cursor_id) ORDER BY ... LIMIT n.\n"
                "3. Rate Limiting: Redis sliding window log for IP and API key limits.\n"
                "4. Documentation: OpenAPI / Swagger specs with strict input validation schemas."
            ),
            "common_mistakes": ["Using OFFSET pagination on million-row tables causing severe table scanning", "Making breaking changes to payload types without versioning"],
            "learning_resources": get_resources_by_skill("System Design")[:2],
            "grounded_source": "REST & API Contract Standards"
        })

        # 9. Priority Skill Gap Grounded Question
        target_gap = gap_names[0] if gap_names else "Caching with Redis"
        pool.append({
            "id": f"sim_syn_{existing_count + 9}",
            "category": "Targeted Skill Growth",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"Based on your preparation profile for {role_title}, '{target_gap}' is a priority competency. "
                f"How would you explain the core concepts of {target_gap} to a fellow engineer at {company_name}, "
                f"and how do you evaluate when to use {target_gap} versus simpler architectural alternatives?"
            ),
            "why_relevant": f"Directly tests your progress in closing identified skill gaps for {role_title}.",
            "expected_points": [
                f"Fundamental theory and production role of {target_gap}.",
                "Clear trade-offs: operational complexity, memory costs, network overhead.",
                "Specific testing and verification strategy.",
                "Production anti-patterns to avoid."
            ],
            "sample_outline": (
                f"1. Definition: Core function of {target_gap}.\n"
                "2. When to Use: Real-time high-throughput requirements where databases become bottlenecks.\n"
                "3. When NOT to Use: Premature optimization for low-volume CRUD operations.\n"
                "4. Safety: Eviction policies (LRU/LFU) and monitoring memory limits."
            ),
            "common_mistakes": ["Reciting textbook definitions without real-world engineering judgment", "Ignoring operational overhead"],
            "learning_resources": get_resources_by_skill(target_gap)[:2],
            "grounded_source": f"Diagnostic Priority Gap: {target_gap}"
        })

        # 10. Algorithmic Trade-offs & Space/Time Complexity
        pool.append({
            "id": f"sim_syn_{existing_count + 10}",
            "category": "Data Structures & Complexity",
            "difficulty": difficulty.capitalize(),
            "question_text": (
                f"In software engineering interviews for {role_title}, interviewers frequently test trade-offs between memory and computational speed. "
                "Can you give an example from your experience or algorithmic practice where you sacrificed memory to achieve O(1) or O(log N) lookup time? "
                "What data structure did you choose, what was the worst-case space complexity, and how did you prevent memory bloat?"
            ),
            "why_relevant": "Evaluates foundational computer science rigor and algorithmic profiling.",
            "expected_points": [
                "Accurate Big-O time and space complexity analysis.",
                "Choice of Hash Table, Trie, LRU Cache, or Bloom Filter.",
                "Worst-case behavior (e.g. hash collisions degrading to O(N)).",
                "Memory compaction and lifecycle cleanup."
            ],
            "sample_outline": (
                "1. The Problem: O(N) linear search bottlenecking high-frequency lookups.\n"
                "2. Solution: In-memory hash index / Trie with precomputed prefixes.\n"
                "3. Complexity: Time improved from O(N) to O(1) / O(K) prefix length, space increased to O(N * K).\n"
                "4. Safeguards: LRU cache eviction to bound total heap allocation."
            ),
            "common_mistakes": ["Confusing average-case with worst-case complexity", "Ignoring memory overhead of large pointer-heavy structures"],
            "learning_resources": get_resources_by_skill("Algorithms")[:2],
            "grounded_source": "Core CS Fundamentals & Complexity Analysis"
        })

        # Return the requested number of synthetic questions
        return pool[:count]

    # -------------------------------------------------------------------------
    # Internal: Structured AI Evaluation with Grounded Fallback
    # -------------------------------------------------------------------------

    @classmethod
    def _evaluate_answer(
        cls,
        question: Dict[str, Any],
        answer_text: str,
        role_title: str,
        company_name: str,
        mode: str
    ) -> Dict[str, Any]:
        """
        Evaluates student answer across 6 dimensions with unified AIService and deterministic fallback.
        """
        q_text = question.get("question_text") or question.get("question", "")
        expected = question.get("expected_points") or []
        sample_outline = question.get("sample_outline") or ""
        category = question.get("category", "General")

        prompt = f"""
Evaluate the candidate's interview answer for the following question:

TARGET ROLE: {role_title}
TARGET COMPANY: {company_name}
INTERVIEW MODE: {mode}
CATEGORY: {category}

QUESTION:
{q_text}

EXPECTED KEY CONCEPTS:
{json.dumps(expected, indent=2)}

REFERENCE OUTLINE:
{sample_outline}

CANDIDATE'S SUBMITTED RESPONSE:
{AIService.wrap_student_context(answer_text)}

EVALUATION DIRECTIVE:
1. Provide constructive, grounded feedback designed for student learning.
2. Rate each of the 6 dimensions on a 1-5 scale (1=Deficient, 2=Basic, 3=Competent, 4=Strong, 5=Exemplary) with 1 sentence of specific feedback for each.
3. Determine an overall score_band: "Strong", "Competent", "Developing", or "Needs Improvement".
4. Determine an overall score_percentage (0 to 100).
5. Identify 2-3 specific things the candidate explained well ("what_went_well").
6. Identify 1-3 missing or misunderstood concepts ("missing_concepts").
7. Provide 1 actionable improvement tip ("suggested_improvement").
8. Provide a polished 3-4 sentence reference sample answer ("sample_answer").
9. Suggest a natural follow-up question ("follow_up_question") based on their answer.

Return ONLY a valid JSON object matching this schema:
{{
  "overall_assessment": "string (2 sentences summary)",
  "score_band": "Strong" | "Competent" | "Developing" | "Needs Improvement",
  "score_percentage": 78,
  "dimensions": {{
    "technical_correctness": {{"score": 4, "feedback": "string"}},
    "completeness": {{"score": 3, "feedback": "string"}},
    "problem_solving": {{"score": 4, "feedback": "string"}},
    "clarity": {{"score": 4, "feedback": "string"}},
    "practical_examples": {{"score": 3, "feedback": "string"}},
    "relevance": {{"score": 4, "feedback": "string"}}
  }},
  "what_went_well": ["string", "string"],
  "missing_concepts": ["string"],
  "suggested_improvement": "string",
  "sample_answer": "string",
  "follow_up_question": "string"
}}
"""
        fallback_enabled = os.getenv("AI_FALLBACK_ENABLED", "true").strip().lower() in ("true", "1", "yes")

        try:
            parsed, metadata = AIService.generate_structured_json(
                prompt=prompt,
                system_instruction=(
                    "You are an encouraging, highly rigorous technical interview coach. "
                    "Evaluate candidate responses accurately against software engineering principles. "
                    "Never hallucinate or pretend to be an official corporate interviewer."
                ),
                timeout=15.0,
                max_retries=1
            )
            if parsed and isinstance(parsed, dict) and "overall_assessment" in parsed:
                # Validate and sanitize AI response
                parsed["is_ai_evaluated"] = True
                parsed["evaluation_source"] = metadata.get("generation_source", "ai")
                parsed["model"] = metadata.get("model", "unknown")
                parsed["learning_resources"] = question.get("learning_resources") or []
                return cls._sanitize_evaluation_dict(parsed, question)
        except Exception as e:
            logger.warning("AI evaluation call failed: %s", str(e))
            if not fallback_enabled:
                raise

        # Deterministic grounded fallback
        return cls._generate_deterministic_evaluation(question, answer_text, role_title)

    @classmethod
    def _sanitize_evaluation_dict(cls, data: Dict[str, Any], question: Dict[str, Any]) -> Dict[str, Any]:
        """Ensures all expected keys and valid ranges are present in evaluation dict."""
        valid_bands = ["Strong", "Competent", "Developing", "Needs Improvement"]
        score_band = data.get("score_band", "Competent")
        if score_band not in valid_bands:
            score_band = "Competent"

        score_pct = data.get("score_percentage", 75)
        try:
            score_pct = max(20, min(int(score_pct), 100))
        except Exception:
            score_pct = 75

        dims = data.get("dimensions") or {}
        sanitized_dims = {}
        for d in ["technical_correctness", "completeness", "problem_solving", "clarity", "practical_examples", "relevance"]:
            dim_val = dims.get(d) or {}
            score = dim_val.get("score", 3) if isinstance(dim_val, dict) else 3
            try:
                score = max(1, min(int(score), 5))
            except Exception:
                score = 3
            feedback = dim_val.get("feedback", "Demonstrates foundational understanding.") if isinstance(dim_val, dict) else "Good effort."
            sanitized_dims[d] = {"score": score, "feedback": str(feedback)}

        return {
            "overall_assessment": str(data.get("overall_assessment") or "Good foundational response with opportunities for deeper technical precision."),
            "score_band": score_band,
            "score_percentage": score_pct,
            "dimensions": sanitized_dims,
            "what_went_well": data.get("what_went_well") or ["Clear logical structure", "Relevant addressing of the core question"],
            "missing_concepts": data.get("missing_concepts") or ["Further elaboration on edge cases and failure modes"],
            "suggested_improvement": str(data.get("suggested_improvement") or "Include concrete metrics or operational trade-offs to make your answer more compelling."),
            "sample_answer": str(data.get("sample_answer") or question.get("sample_outline", "Clear technical reference outline.")),
            "follow_up_question": str(data.get("follow_up_question") or "How would you handle this under high concurrency?"),
            "learning_resources": question.get("learning_resources") or [],
            "is_ai_evaluated": data.get("is_ai_evaluated", True),
            "evaluation_source": data.get("evaluation_source", "ai")
        }

    @classmethod
    def _generate_deterministic_evaluation(
        cls,
        question: Dict[str, Any],
        answer_text: str,
        role_title: str
    ) -> Dict[str, Any]:
        """
        Deterministic, grounded evaluation fallback analyzing keyword matches,
        expected points coverage, and response depth.
        """
        ans_lower = answer_text.lower()
        word_count = len(ans_lower.split())

        expected_points = question.get("expected_points") or []
        matches = 0
        missed = []

        for pt in expected_points:
            # Check if key tokens in expected point appear in answer
            tokens = [t.lower() for t in re.findall(r'\b[a-zA-Z]{4,}\b', pt)]
            common_matches = [t for t in tokens if t in ans_lower]
            if len(common_matches) >= 2 or (tokens and common_matches):
                matches += 1
            else:
                missed.append(pt)

        # Calculate coverage ratio
        total_pts = max(1, len(expected_points))
        coverage_ratio = matches / total_pts

        if word_count > 60 and coverage_ratio >= 0.6:
            score_band = "Strong"
            score_pct = min(92, int(75 + (coverage_ratio * 20)))
            rating = 4
        elif word_count > 30 and coverage_ratio >= 0.3:
            score_band = "Competent"
            score_pct = min(78, int(60 + (coverage_ratio * 20)))
            rating = 3
        elif word_count > 15:
            score_band = "Developing"
            score_pct = 58
            rating = 2
        else:
            score_band = "Needs Improvement"
            score_pct = 45
            rating = 2

        what_well = [
            f"Addressed the primary theme of {question.get('category', 'the topic')}.",
            "Demonstrated logical train of thought and communicative clarity."
        ]
        if matches > 1:
            what_well.append(f"Successfully incorporated {matches} key engineering concepts.")

        missing = []
        if missed:
            missing.append(f"Could more explicitly explain: {missed[0][:100]}...")
        else:
            missing.append("Consider detailing system failure modes and monitoring metrics.")

        return {
            "overall_assessment": (
                f"Your response shows {score_band.lower()} comprehension for {role_title} preparation. "
                f"You covered key points effectively while leaving room for deeper architectural trade-off discussion."
            ),
            "score_band": score_band,
            "score_percentage": score_pct,
            "dimensions": {
                "technical_correctness": {"score": rating, "feedback": "Core technical assertions are sound and accurate."},
                "completeness": {"score": rating, "feedback": f"Addressed {matches} of {total_pts} key concepts."},
                "problem_solving": {"score": rating, "feedback": "Structured reasoning aligns with standard engineering practices."},
                "clarity": {"score": max(3, rating), "feedback": "Clean, understandable written expression."},
                "practical_examples": {"score": max(2, rating - 1), "feedback": "Consider reinforcing with concrete production examples."},
                "relevance": {"score": 4, "feedback": "Directly relevant to the interview question asked."}
            },
            "what_went_well": what_well,
            "missing_concepts": missing,
            "suggested_improvement": (
                "Ground your answer with an explicit real-world trade-off (e.g. latency vs consistency, memory vs CPU) "
                "to demonstrate senior-level engineering instincts."
            ),
            "sample_answer": question.get("sample_outline") or "Start with the primary architectural principle, discuss operational constraints, and summarize the business or performance outcome.",
            "follow_up_question": (question.get("common_mistakes") and f"How would you test this to ensure {question['common_mistakes'][0].lower()} does not occur?") or "What monitoring alerts would you configure in production?",
            "learning_resources": question.get("learning_resources") or [],
            "is_ai_evaluated": False,
            "evaluation_source": "deterministic_fallback"
        }

    # -------------------------------------------------------------------------
    # Internal: Session Completion Analytics
    # -------------------------------------------------------------------------

    @classmethod
    def _compute_session_summary(cls, session: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates final session summary and progress recommendations."""
        evals = session.get("evaluations") or {}
        answers = session.get("answers") or {}
        questions = session.get("questions") or []

        total_q = len(questions)
        answered_q = len(answers)

        score_bands = [ev.get("score_band") for ev in evals.values() if ev.get("score_band")]
        percentages = [ev.get("score_percentage", 70) for ev in evals.values() if ev.get("score_percentage") is not None]

        avg_score = int(sum(percentages) / len(percentages)) if percentages else 0

        # Frequency count of score bands
        if avg_score >= 85:
            overall_band = "Strong"
        elif avg_score >= 70:
            overall_band = "Competent"
        elif avg_score >= 55:
            overall_band = "Developing"
        else:
            overall_band = "Needs Improvement"

        # Aggregate missing concepts
        focus_areas = []
        for ev in evals.values():
            for m in ev.get("missing_concepts", []):
                if m not in focus_areas:
                    focus_areas.append(m)

        return {
            "total_questions": total_q,
            "answered_questions": answered_q,
            "completion_rate": int((answered_q / max(1, total_q)) * 100),
            "average_score": avg_score,
            "overall_band": overall_band,
            "focus_areas": focus_areas[:3],
            "disclaimer": SIMULATOR_DISCLAIMER
        }
