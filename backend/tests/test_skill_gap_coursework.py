"""
Tests for Skill Gap Coursework Evidence Extraction, Provenance, and Deterministic Mapping.
Validates Phase 3, Batch 3.3 requirements:
1. Coursework extraction from root and nested education profile formats.
2. Deterministic regex-based mapping of academic courses to standardized skills.
3. Provenance hierarchy: demonstrated > coursework > listed > needs_verification.
4. Non-upgrade rule: coursework NEVER upgrades to 'demonstrated' without project evidence.
5. Explanation accuracy: no false 'No project or coursework evidence' when coursework exists.
6. Transparent, uninflated readiness calculations.
"""

import pytest
from app.services.skill_gap_service import (
    SkillGapService,
    COURSE_SKILL_RULES,
)


class TestCourseworkExtraction:
    """Tests extraction of coursework from varied student profile schemas."""

    def test_extract_coursework_from_root_list(self):
        profile = {
            "coursework": ["Database Management Systems", "Data Structures & Algorithms", "Operating Systems"]
        }
        courses = [c["name"] for c in SkillGapService._extract_student_coursework(profile)]
        assert len(courses) == 3
        assert "Database Management Systems" in courses
        assert "Data Structures & Algorithms" in courses
        assert "Operating Systems" in courses

    def test_extract_coursework_from_comma_delimited_string(self):
        profile = {
            "coursework": "Database Management Systems, Computer Networks, Software Engineering"
        }
        courses = [c["name"] for c in SkillGapService._extract_student_coursework(profile)]
        assert len(courses) == 3
        assert "Database Management Systems" in courses
        assert "Computer Networks" in courses
        assert "Software Engineering" in courses

    def test_extract_coursework_from_alternative_keys(self):
        profile = {
            "academic_courses": ["Object Oriented Programming", "Compiler Design"],
            "courses": ["Cloud Computing"]
        }
        courses = [c["name"] for c in SkillGapService._extract_student_coursework(profile)]
        assert "Object Oriented Programming" in courses
        assert "Compiler Design" in courses
        assert "Cloud Computing" in courses

    def test_extract_coursework_from_nested_education_list(self):
        profile = {
            "education": [
                {
                    "institution": "Tech University",
                    "degree": "B.Tech CSE",
                    "relevant_coursework": ["Deep Learning", "Natural Language Processing"]
                },
                {
                    "institution": "Polytechnic",
                    "courses": "Discrete Mathematics, Computer Architecture"
                }
            ]
        }
        courses = [c["name"] for c in SkillGapService._extract_student_coursework(profile)]
        assert "Deep Learning" in courses
        assert "Natural Language Processing" in courses
        assert "Discrete Mathematics" in courses
        assert "Computer Architecture" in courses

    def test_extract_coursework_from_nested_education_dict(self):
        profile = {
            "education": {
                "degree": "B.S. in Computer Science",
                "coursework": ["Web Technologies", "Cyber Security"]
            }
        }
        courses = [c["name"] for c in SkillGapService._extract_student_coursework(profile)]
        assert "Web Technologies" in courses
        assert "Cyber Security" in courses

    def test_extract_empty_or_invalid_profile(self):
        assert SkillGapService._extract_student_coursework({}) == []
        assert SkillGapService._extract_student_coursework({"coursework": ""}) == []
        assert SkillGapService._extract_student_coursework(None) == []


class TestDeterministicCourseMapping:
    """Tests regex and keyword mapping of academic courses to skills."""

    def test_dbms_mapping(self):
        skills = SkillGapService._map_course_to_skills("Database Management Systems (DBMS)")
        assert "SQL" in skills
        assert "Databases" in skills
        assert "Database Design" in skills

    def test_dsa_mapping(self):
        skills = SkillGapService._map_course_to_skills("Design & Analysis of Algorithms and Data Structures")
        assert "Data Structures" in skills
        assert "Algorithms" in skills
        assert "DSA" in skills

    def test_os_mapping(self):
        skills = SkillGapService._map_course_to_skills("Operating Systems & System Programming")
        assert "Operating Systems" in skills
        assert "Linux" in skills

    def test_web_tech_mapping(self):
        skills = SkillGapService._map_course_to_skills("Full Stack Web Technologies & Applications")
        assert "JavaScript" in skills
        assert "HTML/CSS" in skills
        assert "REST APIs" in skills

    def test_boundary_no_false_positive_substrings(self):
        # "Art History" should not match C or AI
        assert not SkillGapService._course_matches_skill("Art History", "C")
        assert not SkillGapService._course_matches_skill("Art History", "AI")
        # "Economics" should not match C
        assert not SkillGapService._course_matches_skill("Intro to Economics", "C")
        # Coursework does match when boundary aligns
        assert SkillGapService._course_matches_skill("C Programming & Data Structures", "C")
        assert SkillGapService._course_matches_skill("Database Management Systems", "SQL")


class TestProvenanceAndInventory:
    """Validates the strict 4-tier provenance hierarchy."""

    def test_coursework_evidence_type_assigned(self):
        profile = {
            "coursework": ["Database Management Systems"],
            "projects": [],
            "experience": [],
            "skills": []
        }
        inventory = SkillGapService._extract_student_skills_inventory(profile)
        sql_entry = next((s for s in inventory if s["name"] == "SQL"), None)
        assert sql_entry is not None
        assert sql_entry["evidenceType"] == "coursework"
        assert sql_entry["source"] == "coursework"
        assert "coursework" in sql_entry["context"].lower()
        assert sql_entry["proficiencyLabel"] == "Academic Coursework"

    def test_strict_provenance_never_upgrades_to_demonstrated_without_project(self):
        profile = {
            "coursework": ["Machine Learning and Deep Learning"],
            "skills": ["Machine Learning", "Deep Learning"],
            "projects": [],  # No project demonstration
            "experience": []
        }
        inventory = SkillGapService._extract_student_skills_inventory(profile)
        ml_entry = next((s for s in inventory if s["name"] == "Machine Learning"), None)
        assert ml_entry is not None
        # Must be 'coursework', NOT 'demonstrated'
        assert ml_entry["evidenceType"] == "coursework"
        assert ml_entry["evidenceType"] != "demonstrated"

    def test_project_evidence_maintains_demonstrated_priority(self):
        profile = {
            "coursework": ["Database Management Systems"],
            "projects": [
                {
                    "title": "E-Commerce Backend",
                    "description": "Designed relational schema with PostgreSQL and complex SQL queries.",
                    "technologies": ["PostgreSQL", "SQL"]
                }
            ],
            "skills": ["SQL"]
        }
        inventory = SkillGapService._extract_student_skills_inventory(profile)
        sql_entry = next((s for s in inventory if s["name"] == "SQL"), None)
        assert sql_entry is not None
        # Provenance: project evidence takes priority as 'demonstrated'
        assert sql_entry["evidenceType"] == "demonstrated"


class TestSkillGapAnalysisExplanations:
    """Validates accurate missing skill explanations without false claims."""

    def test_missing_skill_with_coursework_explains_lacking_project_proof(self):
        service = SkillGapService()
        user_profile = {
            "skills": ["Python"],
            "coursework": ["Database Management Systems"],
            "projects": [],
            "experience": []
        }
        job_opportunity = {
            "title": "Backend Developer",
            "required_skills": ["Python", "SQL"],
            "preferred_skills": []
        }

        analysis = service.analyze(
            student_skills=user_profile.get("skills", []),
            target_role="Backend Developer",
            target_opportunity=job_opportunity,
            user_profile=user_profile
        )

        # Check skill comparison summary
        summary = analysis["skillComparison"]["summary"]
        assert summary["courseworkSkills"] >= 1

        # Check matched skills
        sql_match = next((s for s in analysis["matchedSkills"] if s["name"] == "SQL"), None)
        assert sql_match is not None
        assert sql_match["evidenceType"] == "coursework"
        assert "practical project recommended" in sql_match["matchReason"].lower()

    def test_missing_skill_explains_academic_coursework_when_not_directly_matched(self):
        service = SkillGapService()
        user_profile = {
            "skills": ["HTML", "CSS"],
            "coursework": ["Computer Networks & Security"],
            "projects": [],
            "experience": []
        }
        # Docker is missing and has no coursework support
        job_opportunity = {
            "title": "DevOps Engineer",
            "required_skills": ["Docker", "Computer Networks"],
            "preferred_skills": []
        }

        analysis = service.analyze(
            student_skills=user_profile.get("skills", []),
            target_role="DevOps Engineer",
            target_opportunity=job_opportunity,
            user_profile=user_profile
        )

        missing = {gap["name"]: gap["reason"] for gap in analysis["missingSkills"]}
        assert "Docker" in missing
        # Docker has no coursework or project evidence
        assert "no project or coursework evidence" in missing["Docker"].lower()


class TestReadinessScoreDeterminism:
    """Verifies that readiness scores remain deterministic and not artificially inflated."""

    def test_readiness_score_deterministic_formula(self):
        service = SkillGapService()
        user_profile = {
            "skills": ["Python", "Flask"],
            "coursework": ["Database Management Systems"],
            "projects": [
                {
                    "title": "Flask API",
                    "description": "Built REST endpoints with Flask.",
                    "technologies": ["Python", "Flask"]
                }
            ]
        }
        job_opportunity = {
            "title": "Python Developer",
            "required_skills": ["Python", "Flask", "SQL", "Docker"],
            "preferred_skills": []
        }

        analysis_1 = service.analyze(
            student_skills=user_profile.get("skills", []),
            target_role="Python Developer",
            target_opportunity=job_opportunity,
            user_profile=user_profile
        )
        analysis_2 = service.analyze(
            student_skills=user_profile.get("skills", []),
            target_role="Python Developer",
            target_opportunity=job_opportunity,
            user_profile=user_profile
        )

        assert analysis_1["readinessScore"] == analysis_2["readinessScore"]
        # Readiness score should be realistic (not 100%)
        assert 0 < analysis_1["readinessScore"] < 100
        # Verification that distinct matched skills are bounded
        assert len(analysis_1["matchedSkills"]) <= len(job_opportunity["required_skills"])
