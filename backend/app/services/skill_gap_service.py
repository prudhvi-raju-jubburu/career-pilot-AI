import os
import json
import logging
from typing import Dict, List, Any, Optional

from app.utils.skill_normalizer import normalize_skill, normalize_skill_list, skills_match
from app.services.skill_requirements import get_role_requirements, get_skill_topic_sequence, TARGET_ROLE_REQUIREMENTS
from app.services.resource_catalog import get_resources_by_skill
from app.services.project_catalog import get_project_by_skill

logger = logging.getLogger(__name__)

class SkillGapService:
    """
    Skill Gap Engine & Personalized Learning Recommendation System.
    Separates skill requirements, normalization, resource catalogs, and AI personalization.
    """

    @classmethod
    def analyze(
        cls,
        student_skills: List[str],
        target_role: str = "Software Engineer",
        target_opportunity: Optional[Dict[str, Any]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Performs full skill gap calculation and builds structured personalized roadmap."""
        # 1. Normalize student skills
        norm_student_skills = normalize_skill_list(student_skills)
        student_skill_set = {s.lower() for s in norm_student_skills}

        # 2. Retrieve role requirements
        role_data = get_role_requirements(target_role)
        role_skills = role_data.get("skills", {})

        core_reqs = role_skills.get("core", [])
        dev_reqs = role_skills.get("development", [])
        eng_reqs = role_skills.get("engineering", [])
        opt_reqs = role_skills.get("optional", [])

        # Blend target opportunity specific skills if provided
        extra_reqs = []
        if target_opportunity and isinstance(target_opportunity, dict):
            opp_skills = target_opportunity.get("requiredSkills") or target_opportunity.get("skills") or []
            for s in opp_skills:
                norm_s = normalize_skill(s)
                if not any(skills_match(r["name"], norm_s) for r in core_reqs + dev_reqs + eng_reqs + opt_reqs):
                    extra_reqs.append({
                        "name": norm_s,
                        "importance": "High",
                        "category": "Target Opportunity",
                        "prerequisites": []
                    })

        all_required = core_reqs + dev_reqs + eng_reqs + opt_reqs + extra_reqs

        # 3. Classify: MATCHED, PARTIAL, MISSING
        matched_skills = []
        partial_skills = []
        missing_skills = []

        total_weight = 0.0
        earned_weight = 0.0

        weight_map = {
            "Critical": 3.0,
            "High": 2.0,
            "Medium": 1.0,
            "Low": 0.5,
        }

        for req in all_required:
            req_name = req["name"]
            norm_req_name = normalize_skill(req_name)
            importance = req.get("importance", "Medium")
            prereqs = req.get("prerequisites", [])
            w = weight_map.get(importance, 1.0)
            total_weight += w

            # Check if student possesses this skill
            has_skill = any(skills_match(s, norm_req_name) for s in norm_student_skills)

            if has_skill:
                matched_skills.append({
                    "name": norm_req_name,
                    "category": req.get("category", "General"),
                    "importance": importance,
                    "status": "MATCHED",
                    "reason": "Verified in your student profile",
                })
                earned_weight += w
            else:
                # Check prerequisites for PARTIAL classification
                prereqs_met = (
                    len(prereqs) > 0 and
                    all(any(skills_match(s, p) for s in norm_student_skills) for p in prereqs)
                )

                # Fetch verified resources, 5-level topic sequence, and practical project
                resources = get_resources_by_skill(norm_req_name)
                topic_sequence = get_skill_topic_sequence(norm_req_name)
                project = get_project_by_skill(norm_req_name)

                # Determine Priority
                priority = importance # Critical | High | Medium | Low

                why_learn = cls._generate_why_learn(norm_req_name, target_role)
                why_matters = cls._generate_why_matters(norm_req_name, target_role, user_profile)

                skill_item = {
                    "name": norm_req_name,
                    "category": req.get("category", "General"),
                    "importance": importance,
                    "priority": priority,
                    "status": "PARTIAL" if prereqs_met else "MISSING",
                    "prerequisites": prereqs,
                    "prerequisitesMet": prereqs_met,
                    "currentLevel": "Detected Foundation" if prereqs_met else "Not Detected",
                    "recommendedLevel": "Intermediate" if importance in ["Critical", "High"] else "Working Knowledge",
                    "estimatedEffort": "3–5 days" if importance in ["Medium", "Low"] else "1–2 weeks",
                    "whyLearn": why_learn,
                    "whyMatters": why_matters,
                    "topics": topic_sequence,
                    "resources": resources,
                    "project": project,
                }

                if prereqs_met:
                    partial_skills.append(skill_item)
                    earned_weight += (w * 0.35) # Partial credit towards readiness
                else:
                    missing_skills.append(skill_item)

        # 4. Readiness Score
        readiness_score = round((earned_weight / total_weight) * 100) if total_weight > 0 else 50
        readiness_score = min(max(readiness_score, 5), 100)

        # 5. Dependency-based Learning Order (NOW -> NEXT -> AFTER THAT -> PROJECT)
        all_unmet = partial_skills + missing_skills
        # Sort by importance weight descending
        all_unmet.sort(key=lambda x: weight_map.get(x["priority"], 1.0), reverse=True)

        now_skills = []
        next_skills = []
        after_that_skills = []

        for item in all_unmet:
            # If no prerequisites or prerequisites already verified in student profile -> NOW
            prereqs = item.get("prerequisites", [])
            has_all_prereqs = not prereqs or all(any(skills_match(s, p) for s in norm_student_skills) for p in prereqs)

            if has_all_prereqs and item["priority"] in ["Critical", "High"]:
                if len(now_skills) < 2:
                    now_skills.append(item)
                else:
                    next_skills.append(item)
            elif item["priority"] in ["Critical", "High"]:
                next_skills.append(item)
            else:
                after_that_skills.append(item)

        # Fallback if buckets are empty
        if not now_skills and all_unmet:
            now_skills.append(all_unmet[0])
            all_unmet = all_unmet[1:]
        if not next_skills and len(all_unmet) > len(now_skills):
            next_skills.append(all_unmet[len(now_skills)])

        # 6. Future Skills (Clearly labeled as Recommended Future Skill)
        future_skills = role_data.get("futureSkills", [])
        formatted_future_skills = []
        for fs in future_skills:
            formatted_future_skills.append({
                "name": fs["name"],
                "reason": fs["reason"],
                "category": fs.get("category", "Emerging Tech"),
                "badge": "Recommended Future Skill",
                "status": "FUTURE_RECOMMENDED"
            })

        # 7. Priority Spotlight (Top 3–5 most critical skills)
        priority_spotlight = (now_skills + next_skills)[:4]

        # 8. Capstone Project Recommendation
        top_skill_name = now_skills[0]["name"] if now_skills else (missing_skills[0]["name"] if missing_skills else "Full Stack")
        capstone_project = get_project_by_skill(top_skill_name)

        return {
            "targetRole": target_role,
            "roleDescription": role_data.get("description", ""),
            "readinessScore": readiness_score,
            "readinessTier": "Interview Ready" if readiness_score >= 80 else ("Strong Contender" if readiness_score >= 60 else "Building Foundations"),
            "stats": {
                "totalRequired": len(all_required),
                "matchedCount": len(matched_skills),
                "partialCount": len(partial_skills),
                "missingCount": len(missing_skills),
            },
            "matchedSkills": matched_skills,
            "partialSkills": partial_skills,
            "missingSkills": missing_skills,
            "prioritySpotlight": priority_spotlight,
            "roadmap": {
                "now": now_skills,
                "next": next_skills,
                "afterThat": after_that_skills,
                "capstoneProject": capstone_project,
            },
            "futureSkills": formatted_future_skills,
        }

    @staticmethod
    def _generate_why_learn(skill: str, role: str) -> str:
        """Explains the technical value and purpose of the skill."""
        descriptions = {
            "Docker": "Docker packages applications and dependencies into portable, isolated containers, eliminating 'it works on my machine' issues across dev and prod.",
            "System Design": "System Design enables architecting scalable, fault-tolerant distributed web architectures capable of handling high concurrency and data volume.",
            "Redis": "Redis provides sub-millisecond in-memory data storage, drastically reducing database load through caching, sessions, and pub/sub message brokering.",
            "AWS": "AWS powers the vast majority of commercial cloud architectures; understanding EC2, S3, RDS, and ECS is essential for deployment.",
            "FastAPI": "FastAPI is the standard modern Python framework for high-throughput async microservices and automatic OpenAPI documentation.",
            "TypeScript": "TypeScript catches runtime bugs at compile time through static typing, improving team velocity and code maintainability in complex apps.",
            "Kubernetes": "Kubernetes automates deployment, scaling, and operational management of containerized applications in production clusters.",
            "Data Structures & Algorithms": "DSA provides the foundational problem-solving patterns needed to write optimal asymptotic time and space efficient code.",
            "Retrieval Augmented Generation (RAG)": "RAG connects foundation LLMs with proprietary company knowledge bases and vector embeddings without hallucinating.",
        }
        return descriptions.get(skill, f"{skill} is an industry-demanded skill that forms a critical building block for modern {role} positions.")

    @staticmethod
    def _generate_why_matters(skill: str, role: str, profile: Optional[Dict[str, Any]]) -> str:
        branch = None
        if profile and isinstance(profile, dict):
            edu = profile.get("education")
            if isinstance(edu, dict):
                b_val = edu.get("branch")
                if isinstance(b_val, dict):
                    branch = b_val.get("value")
                elif isinstance(b_val, str):
                    branch = b_val
        branch_text = f"As a {branch} student, " if branch else "For your career trajectory, "
        return (
            f"{branch_text}mastering {skill} elevates your resume from academic coursework "
            f"to production-ready commercial capability for {role} hiring pipelines."
        )
