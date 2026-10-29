import os
import json
import logging
from typing import Dict, List, Any, Optional

from app.utils.skill_normalizer import normalize_skill, normalize_skill_list, skills_match
from app.services.skill_requirements import get_role_requirements, get_skill_topic_sequence, TARGET_ROLE_REQUIREMENTS
from app.services.resource_catalog import get_resources_by_skill
from app.services.project_catalog import get_project_by_skill

logger = logging.getLogger(__name__)

# Standard categories for visual analytics & horizontal bar charts
CANONICAL_CATEGORIES = [
    "Programming Languages",
    "Databases",
    "Frameworks & Development",
    "Computer Science Fundamentals",
    "Cloud & DevOps",
    "Data Science & AI",
    "Testing & Software Engineering"
]

CATEGORY_MAPPING = {
    # Languages
    "python": "Programming Languages",
    "c++": "Programming Languages",
    "cpp": "Programming Languages",
    "c": "Programming Languages",
    "java": "Programming Languages",
    "javascript": "Programming Languages",
    "typescript": "Programming Languages",
    "go": "Programming Languages",
    "golang": "Programming Languages",
    "rust": "Programming Languages",
    "c#": "Programming Languages",
    "csharp": "Programming Languages",
    "ruby": "Programming Languages",
    "php": "Programming Languages",
    "kotlin": "Programming Languages",
    "swift": "Programming Languages",
    "r": "Programming Languages",

    # Databases
    "sql": "Databases",
    "mongodb": "Databases",
    "postgresql": "Databases",
    "postgres": "Databases",
    "mysql": "Databases",
    "redis": "Databases",
    "database management systems": "Databases",
    "dbms": "Databases",
    "dynamodb": "Databases",
    "cassandra": "Databases",
    "sqlite": "Databases",
    "elasticsearch": "Databases",

    # Frameworks & Development
    "react": "Frameworks & Development",
    "node.js": "Frameworks & Development",
    "nodejs": "Frameworks & Development",
    "express": "Frameworks & Development",
    "fastapi": "Frameworks & Development",
    "django": "Frameworks & Development",
    "flask": "Frameworks & Development",
    "next.js": "Frameworks & Development",
    "vue": "Frameworks & Development",
    "angular": "Frameworks & Development",
    "spring boot": "Frameworks & Development",
    "rest apis": "Frameworks & Development",
    "restful apis": "Frameworks & Development",
    "graphql": "Frameworks & Development",
    "redux": "Frameworks & Development",
    "tailwind css": "Frameworks & Development",
    "html/css": "Frameworks & Development",
    "html": "Frameworks & Development",
    "css": "Frameworks & Development",

    # CS Fundamentals
    "data structures & algorithms": "Computer Science Fundamentals",
    "dsa": "Computer Science Fundamentals",
    "object-oriented programming (oop)": "Computer Science Fundamentals",
    "oop": "Computer Science Fundamentals",
    "operating systems": "Computer Science Fundamentals",
    "os": "Computer Science Fundamentals",
    "computer networks": "Computer Science Fundamentals",
    "networks": "Computer Science Fundamentals",
    "system design": "Computer Science Fundamentals",
    "system design & distributed systems": "Computer Science Fundamentals",
    "distributed systems": "Computer Science Fundamentals",

    # Cloud & DevOps
    "docker": "Cloud & DevOps",
    "kubernetes": "Cloud & DevOps",
    "aws": "Cloud & DevOps",
    "ci/cd": "Cloud & DevOps",
    "git": "Cloud & DevOps",
    "linux": "Cloud & DevOps",
    "azure": "Cloud & DevOps",
    "gcp": "Cloud & DevOps",
    "terraform": "Cloud & DevOps",
    "microservices": "Cloud & DevOps",
    "cloud native architecture (aws/gcp)": "Cloud & DevOps",
    "serverless & edge compute": "Cloud & DevOps",

    # Data Science & AI
    "machine learning": "Data Science & AI",
    "deep learning": "Data Science & AI",
    "pytorch": "Data Science & AI",
    "tensorflow": "Data Science & AI",
    "pandas": "Data Science & AI",
    "numpy": "Data Science & AI",
    "scikit-learn": "Data Science & AI",
    "generative ai": "Data Science & AI",
    "retrieval augmented generation (rag)": "Data Science & AI",
    "vector databases": "Data Science & AI",
    "ai-assisted development": "Data Science & AI",
    "vector databases & ai integration": "Data Science & AI",
    "large language models": "Data Science & AI",
    "llms": "Data Science & AI",

    # Testing & Engineering
    "testing": "Testing & Software Engineering",
    "unit testing": "Testing & Software Engineering",
    "testing (jest / rtl)": "Testing & Software Engineering",
    "web performance & vitals": "Testing & Software Engineering",
    "pytest": "Testing & Software Engineering",
    "jest": "Testing & Software Engineering",
}

class SkillGapService:
    """
    Skill Gap Engine & Personalized Learning Recommendation System.
    Produces visual analytics, grounded gap classification, explainable evidence tracking,
    and milestone-based roadmaps backed by transparent calculation policies.
    """

    @classmethod
    def _classify_category(cls, skill_name: str, fallback: str = "General") -> str:
        """Maps any skill name or alias into one of the 7 canonical visual categories."""
        norm = normalize_skill(skill_name).lower()
        if norm in CATEGORY_MAPPING:
            return CATEGORY_MAPPING[norm]
        
        # Check substring matches
        for key, cat in CATEGORY_MAPPING.items():
            if key in norm or norm in key:
                return cat
                
        # Fallback to category text if recognizable
        fb_lower = str(fallback).lower()
        if "lang" in fb_lower:
            return "Programming Languages"
        if "data" in fb_lower and "base" in fb_lower:
            return "Databases"
        if "front" in fb_lower or "back" in fb_lower or "dev" in fb_lower or "web" in fb_lower:
            return "Frameworks & Development"
        if "core" in fb_lower or "fund" in fb_lower:
            return "Computer Science Fundamentals"
        if "cloud" in fb_lower or "devops" in fb_lower or "tool" in fb_lower:
            return "Cloud & DevOps"
        if "ai" in fb_lower or "ml" in fb_lower or "science" in fb_lower:
            return "Data Science & AI"
        if "test" in fb_lower or "qual" in fb_lower or "opt" in fb_lower:
            return "Testing & Software Engineering"

        return "Frameworks & Development"

    @classmethod
    def _extract_student_skills_inventory(
        cls,
        user_profile: Optional[Dict[str, Any]],
        norm_student_skills: List[str],
        all_required: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Extracts verified skills inventory with explicit provenance (resume, project, experience, or manual)
        and evidence qualification (demonstrated vs listed on resume vs needs verification).
        """
        inventory: Dict[str, Dict[str, Any]] = {}
        profile = user_profile or {}

        # 1. Inspect projects for practical demonstrations
        projects = profile.get("projects") or []
        for proj in projects:
            p_name = proj.get("name") or proj.get("title") or "Student Project"
            p_techs = proj.get("technologies") or proj.get("tech_stack") or proj.get("skills") or []
            if isinstance(p_techs, str):
                p_techs = [s.strip() for s in p_techs.split(",") if s.strip()]
            for raw_tech in p_techs:
                norm_t = normalize_skill(str(raw_tech))
                inventory[norm_t.lower()] = {
                    "name": norm_t,
                    "category": cls._classify_category(norm_t),
                    "source": "project",
                    "evidenceType": "demonstrated",
                    "context": f"Implemented in project '{p_name}'",
                    "proficiencyLabel": "Demonstrated via Project",
                }

        # 2. Inspect experience for work-based demonstrations
        experience = profile.get("experience") or []
        for exp in experience:
            comp = exp.get("organization") or exp.get("company") or "Company"
            role = exp.get("role") or "Role"
            e_skills = exp.get("skills") or []
            if isinstance(e_skills, str):
                e_skills = [s.strip() for s in e_skills.split(",") if s.strip()]
            for raw_s in e_skills:
                norm_s = normalize_skill(str(raw_s))
                key = norm_s.lower()
                if key not in inventory or inventory[key]["evidenceType"] != "demonstrated":
                    inventory[key] = {
                        "name": norm_s,
                        "category": cls._classify_category(norm_s),
                        "source": "experience",
                        "evidenceType": "demonstrated",
                        "context": f"Applied during internship/work at {comp} ({role})",
                        "proficiencyLabel": "Demonstrated via Experience",
                    }

        # 3. Inspect field_sources for resume provenance vs manual entry
        field_sources = profile.get("field_sources") or {}
        resume_info = profile.get("resume") or {}
        resume_uploaded = bool(resume_info.get("fileName") or resume_info.get("file_name"))

        for s in norm_student_skills:
            key = s.lower()
            if key not in inventory:
                # Determine provenance
                is_from_resume = False
                for f_key, f_val in field_sources.items():
                    if "skills" in f_key and f_val == "resume":
                        is_from_resume = True
                        break

                if is_from_resume or (resume_uploaded and not field_sources):
                    inventory[key] = {
                        "name": s,
                        "category": cls._classify_category(s),
                        "source": "resume",
                        "evidenceType": "listed",
                        "context": "Extracted from uploaded resume document",
                        "proficiencyLabel": "Listed on Resume",
                    }
                else:
                    inventory[key] = {
                        "name": s,
                        "category": cls._classify_category(s),
                        "source": "manual",
                        "evidenceType": "needs_verification",
                        "context": "Manually added to student profile without linked project",
                        "proficiencyLabel": "Needs Verification",
                    }

        # Determine relevance to target role requirements
        req_names = {r["name"].lower(): r for r in all_required}
        results = []
        for item in inventory.values():
            key = item["name"].lower()
            if key in req_names:
                req = req_names[key]
                item["relevance"] = "required" if req.get("importance") in ["Critical", "High"] else "preferred"
                item["targetRoleDemand"] = req.get("importance", "Medium")
            else:
                item["relevance"] = "complementary"
                item["targetRoleDemand"] = "Complementary"
            results.append(item)

        results.sort(key=lambda x: (0 if x["evidenceType"] == "demonstrated" else 1, x["name"]))
        return results

    @classmethod
    def analyze(
        cls,
        student_skills: List[str],
        target_role: str = "Software Engineer",
        target_opportunity: Optional[Dict[str, Any]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Performs full skill gap calculation, category distribution breakdown,
        and builds structured, milestone-based learning plans.
        """
        # 1. Normalize student skills
        norm_student_skills = normalize_skill_list(student_skills)

        # 2. Retrieve role requirements
        role_data = get_role_requirements(target_role)
        role_skills = role_data.get("skills", {})

        core_reqs = role_skills.get("core", [])
        dev_reqs = role_skills.get("development", [])
        eng_reqs = role_skills.get("engineering", [])
        opt_reqs = role_skills.get("optional", [])

        # Assign requirement classification tags
        for r in core_reqs:
            r["requirementType"] = "Mandatory Requirement"
            r["isMandatory"] = True
        for r in dev_reqs:
            r["requirementType"] = "Mandatory Requirement"
            r["isMandatory"] = True
        for r in eng_reqs:
            r["requirementType"] = "Mandatory Requirement"
            r["isMandatory"] = True
        for r in opt_reqs:
            r["requirementType"] = "Preferred Qualification"
            r["isMandatory"] = False

        # Blend target opportunity specific skills if provided
        extra_reqs = []
        target_opp_title = None
        if target_opportunity and isinstance(target_opportunity, dict):
            target_opp_title = target_opportunity.get("title") or target_opportunity.get("role") or "Selected Opportunity"
            opp_skills = target_opportunity.get("requiredSkills") or target_opportunity.get("skills") or []
            for s in opp_skills:
                norm_s = normalize_skill(s)
                if not any(skills_match(r["name"], norm_s) for r in core_reqs + dev_reqs + eng_reqs + opt_reqs):
                    extra_reqs.append({
                        "name": norm_s,
                        "importance": "High",
                        "category": cls._classify_category(norm_s, "Development"),
                        "requirementType": f"Required by {target_opp_title}",
                        "isMandatory": True,
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

        # Build student inventory for evidence tracking
        student_inventory = cls._extract_student_skills_inventory(user_profile, norm_student_skills, all_required)
        inventory_map = {item["name"].lower(): item for item in student_inventory}

        for req in all_required:
            req_name = req["name"]
            norm_req_name = normalize_skill(req_name)
            importance = req.get("importance", "Medium")
            prereqs = req.get("prerequisites", [])
            w = weight_map.get(importance, 1.0)
            total_weight += w

            # Check if student possesses this skill
            has_skill = any(skills_match(s, norm_req_name) for s in norm_student_skills)
            canonical_cat = cls._classify_category(norm_req_name, req.get("category", "General"))

            if has_skill:
                # Find evidence from inventory
                matched_inv = next((inv for inv in student_inventory if skills_match(inv["name"], norm_req_name)), None)
                evidence_text = matched_inv["context"] if matched_inv else "Verified in student profile"
                evidence_type = matched_inv["evidenceType"] if matched_inv else "listed"
                proficiency = matched_inv["proficiencyLabel"] if matched_inv else "Listed on Resume"

                matched_skills.append({
                    "name": norm_req_name,
                    "category": canonical_cat,
                    "importance": importance,
                    "requirementType": req.get("requirementType", "Required"),
                    "isMandatory": req.get("isMandatory", True),
                    "status": "MATCHED",
                    "reason": evidence_text,
                    "evidenceType": evidence_type,
                    "proficiencyLabel": proficiency,
                })
                earned_weight += w
            else:
                # Check prerequisites for PARTIAL classification
                prereqs_met = (
                    len(prereqs) > 0 and
                    all(any(skills_match(s, p) for s in norm_student_skills) for p in prereqs)
                )

                resources = get_resources_by_skill(norm_req_name)
                topic_sequence = get_skill_topic_sequence(norm_req_name)
                project = get_project_by_skill(norm_req_name)
                priority = importance

                why_learn = cls._generate_why_learn(norm_req_name, target_role)
                why_matters = cls._generate_why_matters(norm_req_name, target_role, user_profile, target_opp_title)

                estimated_hours = 8 if importance in ["Medium", "Low"] else 15
                estimated_days = "3–5 days (approx. 8–10 hours)" if importance in ["Medium", "Low"] else "1–2 weeks (approx. 15–20 hours)"

                missing_evidence_text = f"Skill '{norm_req_name}' is requested for {target_role}, but no project or coursework evidence was found in your profile."
                if target_opp_title:
                    missing_evidence_text = f"Explicitly listed in requirements for {target_opp_title}; currently missing from your verified profile."

                skill_item = {
                    "name": norm_req_name,
                    "category": canonical_cat,
                    "importance": importance,
                    "priority": priority,
                    "requirementType": req.get("requirementType", "Required"),
                    "isMandatory": req.get("isMandatory", True),
                    "status": "PARTIAL" if prereqs_met else "MISSING",
                    "prerequisites": prereqs,
                    "prerequisitesMet": prereqs_met,
                    "currentLevel": "Detected Foundation" if prereqs_met else "Not Detected",
                    "recommendedLevel": "Intermediate" if importance in ["Critical", "High"] else "Working Knowledge",
                    "estimatedEffort": estimated_days,
                    "estimatedHours": estimated_hours,
                    "whyLearn": why_learn,
                    "whyMatters": why_matters,
                    "missingEvidence": missing_evidence_text,
                    "topics": topic_sequence,
                    "resources": resources,
                    "project": project,
                }

                if prereqs_met:
                    partial_skills.append(skill_item)
                    earned_weight += (w * 0.35)
                else:
                    missing_skills.append(skill_item)

        # 4. Target-Role Skill Coverage & Readiness Calculation
        # Policy: Matched required skills divided by total distinct required skills
        distinct_required = len(all_required)
        distinct_matched = len(matched_skills)
        target_role_coverage = round((distinct_matched / distinct_required) * 100) if distinct_required > 0 else 0
        target_role_coverage = min(max(target_role_coverage, 0), 100)

        # Weighted Readiness Score (for algorithm ranking compatibility)
        readiness_score = round((earned_weight / total_weight) * 100) if total_weight > 0 else 50
        readiness_score = min(max(readiness_score, 5), 100)

        # 5. Dependency-based Learning Order
        all_unmet = partial_skills + missing_skills
        all_unmet.sort(key=lambda x: (
            0 if x["isMandatory"] else 1,
            0 if x.get("prerequisitesMet") else 1,
            -weight_map.get(x["priority"], 1.0)
        ))

        now_skills = []
        next_skills = []
        after_that_skills = []

        for item in all_unmet:
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

        if not now_skills and all_unmet:
            now_skills.append(all_unmet[0])
            all_unmet = all_unmet[1:]
        if not next_skills and len(all_unmet) > len(now_skills):
            next_skills.append(all_unmet[len(now_skills)])

        # 6. Future Skills (Recommended complementary technologies)
        future_skills = role_data.get("futureSkills", [])
        formatted_future_skills = []
        for fs in future_skills:
            f_cat = cls._classify_category(fs["name"], fs.get("category", "Emerging Tech"))
            formatted_future_skills.append({
                "name": fs["name"],
                "reason": fs["reason"],
                "category": f_cat,
                "badge": "Recommended Future Skill",
                "status": "FUTURE_RECOMMENDED",
                "prerequisites": fs.get("prerequisites", []),
                "estimatedEffort": fs.get("estimatedEffort", "1–2 weeks"),
                "suggestedProject": fs.get("suggestedProject", f"Build a practical hands-on proof of concept demonstrating {fs['name']}."),
                "priorityType": "optional_exploration",
            })

        # 7. Priority Spotlight (Top 4 most critical actionable gaps)
        priority_spotlight = (now_skills + next_skills)[:4]

        # 8. Capstone Project Recommendation
        top_skill_name = now_skills[0]["name"] if now_skills else (missing_skills[0]["name"] if missing_skills else "Full Stack")
        capstone_project = get_project_by_skill(top_skill_name)

        # 9. Category Breakdown for Visual Horizontal Bar Chart
        category_breakdown = cls._build_category_breakdown(all_required, matched_skills, norm_student_skills)

        # 10. Grouped Requirement Comparison (Current vs Target Requirements)
        skill_comparison = cls._build_skill_comparison(all_required, matched_skills, student_inventory)

        # 11. Structured Milestone Roadmap
        structured_roadmap = cls._build_structured_roadmap(
            now_skills=now_skills,
            next_skills=next_skills,
            after_that_skills=after_that_skills,
            capstone_project=capstone_project,
            target_role=target_role
        )

        return {
            "targetRole": target_role,
            "targetOpportunity": target_opp_title,
            "roleDescription": role_data.get("description", ""),
            "skillCoverage": target_role_coverage,
            "readinessScore": readiness_score,
            "readinessTier": "Interview Ready" if target_role_coverage >= 80 else ("Strong Contender" if target_role_coverage >= 60 else "Building Foundations"),
            "coveragePolicy": "Calculated as matched required skills divided by total distinct skills requested for this target role.",
            "stats": {
                "totalRequired": distinct_required,
                "matchedCount": distinct_matched,
                "partialCount": len(partial_skills),
                "missingCount": len(missing_skills),
                "skillCoverage": target_role_coverage,
                "priorityGapCount": len([s for s in (partial_skills + missing_skills) if s["priority"] in ["Critical", "High"]]),
                "totalIdentifiedSkills": len(student_inventory),
            },
            "matchedSkills": matched_skills,
            "partialSkills": partial_skills,
            "missingSkills": missing_skills,
            "prioritySpotlight": priority_spotlight,
            "priorityGaps": (now_skills + next_skills + after_that_skills)[:6],
            "skillsInventory": student_inventory,
            "categoryBreakdown": category_breakdown,
            "skillComparison": skill_comparison,
            "structuredRoadmap": structured_roadmap,
            "roadmap": {
                "now": now_skills,
                "next": next_skills,
                "afterThat": after_that_skills,
                "capstoneProject": capstone_project,
            },
            "futureSkills": formatted_future_skills,
            "emergingRecommendations": formatted_future_skills,
        }

    @classmethod
    def _build_category_breakdown(
        cls,
        all_required: List[Dict[str, Any]],
        matched_skills: List[Dict[str, Any]],
        norm_student_skills: List[str]
    ) -> List[Dict[str, Any]]:
        """Computes target vs verified skill counts across standard categories for bar charts."""
        cat_stats = {cat: {"target": 0, "matched": 0, "matched_skills": [], "missing_skills": []} for cat in CANONICAL_CATEGORIES}

        # Accumulate target skills
        for req in all_required:
            cat = cls._classify_category(req["name"], req.get("category", "General"))
            if cat not in cat_stats:
                cat_stats[cat] = {"target": 0, "matched": 0, "matched_skills": [], "missing_skills": []}
            cat_stats[cat]["target"] += 1

            # Check if matched
            matched_match = next((m for m in matched_skills if skills_match(m["name"], req["name"])), None)
            if matched_match:
                cat_stats[cat]["matched"] += 1
                cat_stats[cat]["matched_skills"].append(matched_match["name"])
            else:
                cat_stats[cat]["missing_skills"].append(req["name"])

        # Filter down to categories with non-zero requirements or student skills
        breakdown = []
        for cat in CANONICAL_CATEGORIES:
            data = cat_stats.get(cat, {"target": 0, "matched": 0, "matched_skills": [], "missing_skills": []})
            target_count = data["target"]
            student_count = data["matched"]
            coverage = round((student_count / target_count) * 100) if target_count > 0 else 100

            if target_count > 0 or student_count > 0:
                breakdown.append({
                    "category": cat,
                    "targetCount": target_count,
                    "studentCount": student_count,
                    "coveragePct": coverage,
                    "matchedSkills": data["matched_skills"],
                    "missingSkills": data["missing_skills"],
                })

        return breakdown

    @classmethod
    def _build_skill_comparison(
        cls,
        all_required: List[Dict[str, Any]],
        matched_skills: List[Dict[str, Any]],
        student_inventory: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Builds grouped metrics distinguishing Demonstrated, Required, Preferred, and Needs Verification."""
        demonstrated_count = sum(1 for s in student_inventory if s["evidenceType"] == "demonstrated")
        listed_count = sum(1 for s in student_inventory if s["evidenceType"] == "listed")
        needs_verification_count = sum(1 for s in student_inventory if s["evidenceType"] == "needs_verification")

        required_count = sum(1 for r in all_required if r.get("isMandatory", True))
        preferred_count = sum(1 for r in all_required if not r.get("isMandatory", True))

        items = []
        for req in all_required:
            r_name = req["name"]
            matched_inv = next((inv for inv in student_inventory if skills_match(inv["name"], r_name)), None)

            if matched_inv:
                s_status = matched_inv["evidenceType"] # demonstrated | listed | needs_verification
                s_source = matched_inv["context"]
            else:
                s_status = "not_found"
                s_source = "Not present in profile"

            items.append({
                "name": r_name,
                "category": cls._classify_category(r_name, req.get("category")),
                "targetRequirement": "Mandatory" if req.get("isMandatory", True) else "Preferred",
                "studentStatus": s_status,
                "evidenceSource": s_source,
                "matched": bool(matched_inv),
            })

        return {
            "summary": {
                "demonstratedSkills": demonstrated_count,
                "listedOnResume": listed_count,
                "needsVerification": needs_verification_count,
                "explicitlyRequired": required_count,
                "preferredQualifications": preferred_count,
            },
            "items": items
        }

    @classmethod
    def _build_structured_roadmap(
        cls,
        now_skills: List[Dict[str, Any]],
        next_skills: List[Dict[str, Any]],
        after_that_skills: List[Dict[str, Any]],
        capstone_project: Optional[Dict[str, Any]],
        target_role: str
    ) -> List[Dict[str, Any]]:
        """
        Organizes gaps into 4 sequential learning milestones:
        Phase 1: Prerequisites & Fundamentals
        Phase 2: Core Target Technology
        Phase 3: Practical Implementation & Architecture
        Phase 4: Capstone Portfolio Project & Revision
        """
        phases = []

        # Phase 1: Prerequisites & Immediate Foundations
        p1_items = []
        for item in now_skills:
            p1_items.append({
                "id": f"milestone-{item['name'].lower().replace(' ', '-')}",
                "skill": item["name"],
                "phase": "Phase 1: Prerequisites & Core Foundations",
                "phaseIndex": 1,
                "learningObjective": f"Master foundational {item['name']} principles and practical code patterns.",
                "estimatedHours": item.get("estimatedHours", 10),
                "priority": item.get("priority", "High"),
                "prerequisites": item.get("prerequisites", []),
                "topics": item.get("topics", []),
                "practicalTask": item.get("project", {}).get("deliverable", f"Write working code examples applying {item['name']}."),
                "completionCriteria": f"Complete practice exercises and build a working mini-project with {item['name']}.",
                "resources": item.get("resources", [])[:3],
                "status": "not_started"
            })

        phases.append({
            "phase": "Phase 1: Prerequisites & Core Foundations",
            "phaseIndex": 1,
            "description": "Establish essential syntax, design patterns, and dependency requirements before tackling advanced stacks.",
            "estimatedWeeks": "Weeks 1–2",
            "milestones": p1_items
        })

        # Phase 2: Core Target Technology
        p2_items = []
        for item in next_skills:
            p2_items.append({
                "id": f"milestone-{item['name'].lower().replace(' ', '-')}",
                "skill": item["name"],
                "phase": "Phase 2: Core Target Technology",
                "phaseIndex": 2,
                "learningObjective": f"Implement production-grade {item['name']} workflows required for {target_role}.",
                "estimatedHours": item.get("estimatedHours", 12),
                "priority": item.get("priority", "High"),
                "prerequisites": item.get("prerequisites", []),
                "topics": item.get("topics", []),
                "practicalTask": item.get("project", {}).get("deliverable", f"Develop an end-to-end service incorporating {item['name']}."),
                "completionCriteria": f"Verify API response handling, test coverage, and documentation for {item['name']}.",
                "resources": item.get("resources", [])[:3],
                "status": "not_started"
            })

        phases.append({
            "phase": "Phase 2: Core Target Technology",
            "phaseIndex": 2,
            "description": "Build fluency in the primary frameworks and engineering tools demanded by your target role.",
            "estimatedWeeks": "Weeks 3–4",
            "milestones": p2_items
        })

        # Phase 3: Practical Implementation & Architecture
        p3_items = []
        for item in after_that_skills:
            p3_items.append({
                "id": f"milestone-{item['name'].lower().replace(' ', '-')}",
                "skill": item["name"],
                "phase": "Phase 3: Practical Implementation & Architecture",
                "phaseIndex": 3,
                "learningObjective": f"Strengthen optimization, caching, testing, or containerization with {item['name']}.",
                "estimatedHours": item.get("estimatedHours", 8),
                "priority": item.get("priority", "Medium"),
                "prerequisites": item.get("prerequisites", []),
                "topics": item.get("topics", []),
                "practicalTask": item.get("project", {}).get("deliverable", f"Integrate {item['name']} into an existing application pipeline."),
                "completionCriteria": f"Deploy and benchmark application behavior with {item['name']}.",
                "resources": item.get("resources", [])[:3],
                "status": "not_started"
            })

        phases.append({
            "phase": "Phase 3: Practical Implementation & Architecture",
            "phaseIndex": 3,
            "description": "Containerize, cache, benchmark, and secure your implementations for commercial-readiness.",
            "estimatedWeeks": "Weeks 5–6",
            "milestones": p3_items
        })

        # Phase 4: Capstone Portfolio Project & Revision
        cap_title = capstone_project.get("title", f"{target_role} Production Portfolio Project") if capstone_project else f"{target_role} Production Portfolio Project"
        cap_desc = capstone_project.get("description", "Deploy a complete full-stack production application with CI/CD and public URL.") if capstone_project else "Deploy a complete full-stack production application with CI/CD and public URL."
        cap_deliverable = capstone_project.get("deliverable", "Public GitHub repository with comprehensive README, live demo, and automated test suite.") if capstone_project else "Public GitHub repository with comprehensive README, live demo, and automated test suite."

        p4_items = [{
            "id": f"milestone-capstone-{target_role.lower().replace(' ', '-')}",
            "skill": f"Capstone: {cap_title}",
            "phase": "Phase 4: Capstone Portfolio Project & Revision",
            "phaseIndex": 4,
            "learningObjective": f"Synthesize all acquired skills into a production-grade portfolio piece for {target_role} hiring managers.",
            "estimatedHours": 20,
            "priority": "Critical",
            "prerequisites": [m["skill"] for m in p1_items + p2_items][:3],
            "topics": [
                {"name": "System Architecture & API Design", "completed": False},
                {"name": "Implementation & Core Features", "completed": False},
                {"name": "Testing & Error Handling", "completed": False},
                {"name": "Containerization & Cloud Deployment", "completed": False},
                {"name": "README, Video Demo & Resume Bullet Polish", "completed": False},
            ],
            "practicalTask": cap_deliverable,
            "completionCriteria": "Public GitHub repository with clean commit history, live deployment link, and passing automated tests.",
            "resources": [],
            "status": "not_started"
        }]

        phases.append({
            "phase": "Phase 4: Capstone Portfolio Project & Revision",
            "phaseIndex": 4,
            "description": "Consolidate learning into an interview-ready portfolio demonstration that proves real-world capability.",
            "estimatedWeeks": "Weeks 7–8",
            "milestones": p4_items
        })

        return phases

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
            "Git": "Git is the ubiquitous version control foundation for collaborative development, branch management, code review, and CI/CD triggers.",
            "SQL": "SQL is the universal query standard for relational databases, essential for transaction management, indices, and analytical joins.",
            "REST APIs": "REST APIs define the standard contract for client-server communication, stateless request/response, and microservice integration.",
        }
        return descriptions.get(skill, f"{skill} is an industry-demanded skill that forms a critical building block for modern {role} positions.")

    @staticmethod
    def _generate_why_matters(skill: str, role: str, profile: Optional[Dict[str, Any]], target_opp: Optional[str] = None) -> str:
        if target_opp:
            return f"Explicitly listed as a required skill for {target_opp}; mastering {skill} directly strengthens your candidate profile."

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

    @classmethod
    def analyze_job_specific_gaps(
        cls,
        application: Dict[str, Any],
        user_profile: Optional[Dict[str, Any]] = None,
        opportunity: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Stage 4 Feature A: Job-specific deterministic skill gap classification.
        Uses:
        - Application's saved job description snapshot or student-provided preparation description.
        - Linked opportunity's structured skills and requirements.
        - Student's current profile and verified resume information.
        - Actual project and experience evidence.
        - Existing skill normalization and requirement classification utilities.

        Classifies every requirement into 5 categories:
        1. Demonstrated: Practical project or work experience evidence found in profile.
        2. Listed: Mentioned on resume or skills list, but lacks concrete project/work proof.
        3. Priority Gap: Mandatory requirement of the job that is missing or unverified.
        4. Preferred Skill: Preferred/optional qualification of the job that is missing.
        5. Unknown: Requirement where profile/resume lacks sufficient details to confirm or refute competency.
        """
        import re
        from app.utils.opportunity_normalizer import extract_skills_from_text
        from app.services.resource_catalog import get_resources_by_skill

        profile = user_profile or {}
        opp = opportunity or {}
        app = application or {}

        role_title = app.get("role") or app.get("role_title") or (opp.get("title") if opp else "Software Engineer")
        company_name = app.get("company") or app.get("company_name") or (opp.get("organization", {}).get("name") if isinstance(opp.get("organization"), dict) else "Hiring Team")

        job_desc = (app.get("job_description") or app.get("job_description_snapshot") or (opp.get("description") if opp else "")).strip()
        job_desc_status = "present" if bool(job_desc) else "missing"

        # 1. Student Skills & Evidence Inventory
        raw_skills = []
        skills_obj = profile.get("skills", {})
        if isinstance(skills_obj, dict):
            for k, v in skills_obj.items():
                items = v.get("value") if isinstance(v, dict) and "value" in v else v
                if isinstance(items, list):
                    raw_skills.extend(items)
        elif isinstance(skills_obj, list):
            for item in skills_obj:
                if isinstance(item, dict):
                    raw_skills.append(item.get("name") or item.get("skill") or "")
                elif isinstance(item, str):
                    raw_skills.append(item)
        norm_student_skills = normalize_skill_list([str(s).strip() for s in raw_skills if s])

        projects = profile.get("projects") or []
        experience = profile.get("experience") or []

        # 2. Extract and assemble job requirements
        requirements_map: Dict[str, Dict[str, Any]] = {}

        # 2a. Role baseline requirements
        role_req_data = get_role_requirements(role_title)
        role_skills_groups = role_req_data.get("skills", {})
        for r in role_skills_groups.get("core", []) + role_skills_groups.get("development", []) + role_skills_groups.get("engineering", []):
            norm_r = normalize_skill(r["name"])
            requirements_map[norm_r.lower()] = {
                "name": norm_r,
                "importance": r.get("importance", "High"),
                "is_mandatory": True,
                "requirement_type": "Mandatory Requirement",
                "job_evidence": f"Core competency standard for {role_title} positions.",
                "category": cls._classify_category(norm_r, r.get("category", "General"))
            }

        for r in role_skills_groups.get("optional", []):
            norm_r = normalize_skill(r["name"])
            requirements_map[norm_r.lower()] = {
                "name": norm_r,
                "importance": r.get("importance", "Medium"),
                "is_mandatory": False,
                "requirement_type": "Preferred Qualification",
                "job_evidence": f"Preferred qualification for {role_title} positions.",
                "category": cls._classify_category(norm_r, r.get("category", "General"))
            }

        # 2b. Opportunity structured skills
        opp_skills = (opp.get("requiredSkills") or opp.get("skills") or []) if opp else []
        for s in opp_skills:
            norm_s = normalize_skill(str(s))
            if norm_s:
                key = norm_s.lower()
                if key not in requirements_map:
                    requirements_map[key] = {
                        "name": norm_s,
                        "importance": "High",
                        "is_mandatory": True,
                        "requirement_type": f"Required by {company_name}",
                        "job_evidence": f"Explicitly listed in opportunity requirements for {role_title} at {company_name}.",
                        "category": cls._classify_category(norm_s)
                    }
                else:
                    requirements_map[key]["is_mandatory"] = True
                    requirements_map[key]["importance"] = "High"
                    requirements_map[key]["requirement_type"] = f"Required by {company_name}"
                    requirements_map[key]["job_evidence"] = f"Explicitly listed in opportunity requirements for {role_title} at {company_name}."

        # 2c. Job description text skills
        if job_desc:
            jd_extracted = extract_skills_from_text(job_desc)
            # Find matching context sentences in JD
            sentences = re.split(r'[\.\n\r•\*\-]\s*', job_desc)
            for s in jd_extracted:
                norm_s = normalize_skill(s)
                key = norm_s.lower()

                matched_sentence = None
                for sent in sentences:
                    clean_sent = sent.strip()
                    if clean_sent and len(clean_sent) > 8 and s.lower() in clean_sent.lower():
                        matched_sentence = clean_sent[:180]
                        break

                is_pref = False
                if matched_sentence:
                    lower_sent = matched_sentence.lower()
                    if any(w in lower_sent for w in ["prefer", "plus", "bonus", "optional", "nice to have", "good to have"]):
                        is_pref = True

                if key not in requirements_map:
                    requirements_map[key] = {
                        "name": norm_s,
                        "importance": "Medium" if is_pref else "High",
                        "is_mandatory": not is_pref,
                        "requirement_type": "Preferred Qualification" if is_pref else "Job Requirement",
                        "job_evidence": matched_sentence or f"Extracted from job description for {role_title}.",
                        "category": cls._classify_category(norm_s)
                    }
                else:
                    if matched_sentence:
                        requirements_map[key]["job_evidence"] = matched_sentence
                    if is_pref:
                        requirements_map[key]["is_mandatory"] = False
                        requirements_map[key]["importance"] = "Medium"
                        requirements_map[key]["requirement_type"] = "Preferred Qualification"
                    else:
                        requirements_map[key]["is_mandatory"] = True
                        requirements_map[key]["importance"] = "High"
                        requirements_map[key]["requirement_type"] = "Job Requirement"

        # 3. Classify Each Requirement
        demonstrated_items = []
        listed_items = []
        priority_gaps = []
        preferred_items = []
        unknown_items = []
        all_classified = []

        total_mandatory = 0
        met_count = 0.0

        for key, req in requirements_map.items():
            req_name = req["name"]
            is_mandatory = req["is_mandatory"]
            if is_mandatory:
                total_mandatory += 1

            # A. Check for Demonstrated evidence (Project or Work Experience)
            demonstrated_source = None
            for p in projects:
                p_techs = p.get("technologies") or p.get("techStack") or p.get("skills") or []
                if isinstance(p_techs, str):
                    p_techs = [t.strip() for t in p_techs.split(",") if t.strip()]
                if any(skills_match(t, req_name) for t in p_techs) or skills_match(p.get("name", ""), req_name):
                    demonstrated_source = f"Demonstrated in project '{p.get('name')}'"
                    break

            if not demonstrated_source:
                for exp in experience:
                    e_skills = exp.get("skills") or []
                    if isinstance(e_skills, str):
                        e_skills = [t.strip() for t in e_skills.split(",") if t.strip()]
                    if any(skills_match(t, req_name) for t in e_skills):
                        demonstrated_source = f"Demonstrated during experience at {exp.get('organization') or exp.get('company')} ({exp.get('role')})"
                        break

            # B. Check for Listed evidence (Resume or Profile Skills)
            listed_source = None
            if not demonstrated_source:
                if any(skills_match(s, req_name) for s in norm_student_skills):
                    listed_source = "Listed in candidate profile / resume skills"

            # C. Classify into 5 categories
            if demonstrated_source:
                classification = "demonstrated"
                student_evidence = demonstrated_source
                met_count += 1.0
            elif listed_source:
                classification = "listed"
                student_evidence = listed_source
                met_count += 0.5
            else:
                # Missing keyword: do not treat as definitive proof of absence
                is_broad_foundation = req_name in [
                    "Operating Systems", "Computer Networks", "Database Management Systems", "System Design"
                ]
                if is_broad_foundation and any(skills_match(s, "Computer Science") or skills_match(s, "Python") or skills_match(s, "C++") for s in norm_student_skills):
                    classification = "unknown"
                    student_evidence = "Not explicitly listed on resume. Foundational coursework may apply; practical verification recommended."
                elif is_mandatory:
                    classification = "priority_gap"
                    student_evidence = "No project, work experience, or resume keyword found in candidate profile."
                else:
                    classification = "preferred"
                    student_evidence = "Preferred qualification not currently detected in candidate profile."

            curated_resources = get_resources_by_skill(req_name)
            item_data = {
                "skill_name": req_name,
                "category": req["category"],
                "importance": req["importance"],
                "requirement_type": req["requirement_type"],
                "is_mandatory": is_mandatory,
                "classification": classification,
                "job_evidence": req["job_evidence"],
                "student_evidence": student_evidence,
                "resources": curated_resources,
            }

            if classification == "demonstrated":
                demonstrated_items.append(item_data)
            elif classification == "listed":
                listed_items.append(item_data)
            elif classification == "priority_gap":
                item_data["priority_reason"] = cls._generate_why_matters(req_name, role_title, profile, company_name)
                item_data["learning_objective"] = f"Master foundational architecture, key syntax patterns, and build a working mini-project with {req_name}."
                item_data["estimated_effort"] = "Estimated effort: ~8–12 hours (1–2 weeks part-time self-study)"
                item_data["in_roadmap"] = False
                priority_gaps.append(item_data)
            elif classification == "preferred":
                item_data["priority_reason"] = f"Complementary skill that differentiates your application for {role_title}."
                item_data["learning_objective"] = f"Understand core {req_name} patterns and how it integrates with primary stack."
                item_data["estimated_effort"] = "Estimated effort: ~4–6 hours (self-paced exploration)"
                item_data["in_roadmap"] = False
                preferred_items.append(item_data)
            elif classification == "unknown":
                item_data["priority_reason"] = "Requirement where current candidate evidence is insufficient to verify competency."
                item_data["learning_objective"] = f"Review {req_name} fundamentals and add concrete portfolio or project evidence."
                item_data["estimated_effort"] = "Estimated effort: ~4–8 hours (review & portfolio project)"
                item_data["in_roadmap"] = False
                unknown_items.append(item_data)

            all_classified.append(item_data)

        # 4. Coverage calculation
        coverage_pct = round((met_count / total_mandatory) * 100) if total_mandatory > 0 else 100
        coverage_pct = min(max(coverage_pct, 0), 100)

        return {
            "role_title": role_title,
            "company_name": company_name,
            "job_description_status": job_desc_status,
            "skill_coverage": coverage_pct,
            "total_requirements": len(all_classified),
            "summary": {
                "total_requirements": len(all_classified),
                "demonstrated_count": len(demonstrated_items),
                "listed_count": len(listed_items),
                "priority_gap_count": len(priority_gaps),
                "preferred_count": len(preferred_items),
                "unknown_count": len(unknown_items),
                "skill_coverage": coverage_pct
            },
            "demonstrated": demonstrated_items,
            "listed": listed_items,
            "priority_gaps": priority_gaps,
            "preferred": preferred_items,
            "unknown": unknown_items,
            "all_requirements": all_classified
        }
