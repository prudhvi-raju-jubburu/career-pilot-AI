import re
from typing import Dict, Any, List, Optional
from app.utils.skill_normalizer import normalize_skill, normalize_skill_list

# Action verbs commonly looked for by ATS and technical hiring teams
STRONG_ACTION_VERBS = {
    "accelerated", "achieved", "analyzed", "architected", "automated", "built", "centralized",
    "collaborated", "configured", "constructed", "created", "decreased", "delivered", "deployed",
    "designed", "developed", "devised", "engineered", "enhanced", "established", "executed",
    "expanded", "formulated", "implemented", "improved", "increased", "initiated", "integrated",
    "launched", "led", "managed", "maximized", "minimized", "modeled", "modernized", "optimized",
    "orchestrated", "overhauled", "pioneered", "produced", "programmed", "reduced", "refactored",
    "resolved", "restructured", "scaled", "simplified", "spearheaded", "standardized", "streamlined",
    "strengthened", "transformed", "upgraded", "validated"
}

# Technical skill synonyms / related domains for transparent semantic matching
RELATED_SKILL_MAP = {
    "react": ["react.js", "next.js", "javascript", "frontend", "redux"],
    "vue": ["vue.js", "nuxt.js", "javascript", "frontend"],
    "angular": ["typescript", "javascript", "frontend"],
    "python": ["django", "flask", "fastapi", "backend", "pandas", "numpy"],
    "flask": ["python", "rest apis", "backend", "fastapi", "django"],
    "django": ["python", "rest apis", "backend", "flask"],
    "node.js": ["javascript", "typescript", "express", "backend"],
    "express": ["node.js", "javascript", "rest apis"],
    "mongodb": ["nosql", "databases", "document db"],
    "postgresql": ["sql", "relational databases", "databases", "mysql"],
    "mysql": ["sql", "relational databases", "databases", "postgresql"],
    "docker": ["containers", "devops", "kubernetes", "ci/cd"],
    "kubernetes": ["containers", "devops", "docker", "cloud orchestration"],
    "aws": ["cloud", "cloud computing", "ec2", "s3", "gcp", "azure"],
    "azure": ["cloud", "cloud computing", "aws", "gcp"],
    "gcp": ["cloud", "cloud computing", "google cloud", "aws"],
    "machine learning": ["data science", "ai", "deep learning", "pytorch", "tensorflow", "scikit-learn"],
    "deep learning": ["machine learning", "neural networks", "pytorch", "tensorflow"],
    "git": ["github", "gitlab", "version control"],
}

class ResumeQualityService:
    """
    Deterministic ATS-related resume quality assessment and keyword comparison engine.
    Calculates transparent scores across 5 dimensions (0-100 pts) with zero hallucinations.
    """

    DISCLAIMER = (
        "An estimate of your resume's formatting, structure, readability, and relevance. "
        "Actual ATS results vary by employer and system."
    )

    @classmethod
    def evaluate(cls, resume_data: dict, target_role: str = "", target_job_description: str = "") -> dict:
        """
        Executes complete quality assessment and returns structured report.
        """
        # 1. Structure and Readability (25 pts)
        struct_res = cls._evaluate_structure(resume_data)

        # 2. Contact and Profile Completeness (15 pts)
        contact_res = cls._evaluate_contact(resume_data)

        # 3. Target-Role Relevance (25 pts)
        relevance_res = cls._evaluate_relevance(resume_data, target_role, target_job_description)

        # 4. Skills and Keywords (20 pts)
        keywords_res = cls._evaluate_skills_and_keywords(resume_data, target_role, target_job_description)

        # 5. Project and Experience Descriptions (15 pts)
        desc_res = cls._evaluate_descriptions(resume_data)

        overall_score = round(
            struct_res["score"] +
            contact_res["score"] +
            relevance_res["score"] +
            keywords_res["score"] +
            desc_res["score"]
        )
        overall_score = max(0, min(100, overall_score))

        category_scores = {
            "structure": {
                "name": "Structure & Readability",
                "score": round(struct_res["score"], 1),
                "max": 25,
                "percentage": round((struct_res["score"] / 25) * 100)
            },
            "contact": {
                "name": "Contact & Completeness",
                "score": round(contact_res["score"], 1),
                "max": 15,
                "percentage": round((contact_res["score"] / 15) * 100)
            },
            "relevance": {
                "name": "Target-Role Relevance",
                "score": round(relevance_res["score"], 1),
                "max": 25,
                "percentage": round((relevance_res["score"] / 25) * 100),
                "mode": relevance_res.get("mode", "targeted")
            },
            "keywords": {
                "name": "Skills & Keywords",
                "score": round(keywords_res["score"], 1),
                "max": 20,
                "percentage": round((keywords_res["score"] / 20) * 100)
            },
            "descriptions": {
                "name": "Project & Experience Details",
                "score": round(desc_res["score"], 1),
                "max": 15,
                "percentage": round((desc_res["score"] / 15) * 100)
            }
        }

        strengths = (
            struct_res["strengths"] +
            contact_res["strengths"] +
            relevance_res["strengths"] +
            keywords_res["strengths"] +
            desc_res["strengths"]
        )

        issues = (
            struct_res["issues"] +
            contact_res["issues"] +
            relevance_res["issues"] +
            keywords_res["issues"] +
            desc_res["issues"]
        )

        recommendations = (
            struct_res["recommendations"] +
            contact_res["recommendations"] +
            relevance_res["recommendations"] +
            keywords_res["recommendations"] +
            desc_res["recommendations"]
        )

        return {
            "score": overall_score,
            "disclaimer": cls.DISCLAIMER,
            "category_scores": category_scores,
            "strengths": strengths,
            "issues": issues,
            "recommendations": recommendations,
            "keyword_analysis": keywords_res["keyword_analysis"],
            "target_role": target_role or "General Software Development",
            "has_job_description": bool(target_job_description and target_job_description.strip())
        }

    @classmethod
    def _evaluate_structure(cls, data: dict) -> dict:
        """Dimension A: Structure and Readability (25 points)."""
        score = 0.0
        strengths = []
        issues = []
        recommendations = []

        # Check section presence (Up to 15 pts)
        has_edu = bool(data.get("education"))
        has_skills = bool(cls._flatten_skills(data.get("skills")))
        has_projects = bool(data.get("projects"))
        has_exp = bool(data.get("experience"))
        has_summary = bool(data.get("summary") and len(str(data.get("summary")).strip()) >= 30)

        sections_count = sum([has_edu, has_skills, has_projects, has_exp, has_summary])
        if sections_count >= 4:
            score += 15.0
            strengths.append({
                "category": "Structure",
                "title": "Comprehensive Section Organization",
                "evidence": f"Resume includes {sections_count} standard core sections (Education, Skills, Projects, Experience/Summary)."
            })
        elif sections_count >= 2:
            score += 10.0
            issues.append({
                "severity": "medium",
                "category": "Structure",
                "title": "Missing Recommended Sections",
                "description": "Consider adding dedicated sections for Projects or Professional Summary to provide a fuller career narrative."
            })
        else:
            score += 5.0
            issues.append({
                "severity": "high",
                "category": "Structure",
                "title": "Incomplete Resume Structure",
                "description": "Essential sections like Education, Technical Skills, and Projects are missing."
            })

        # Check Summary length & structure (5 pts)
        summary = str(data.get("summary", "")).strip()
        if summary:
            word_count = len(summary.split())
            if 25 <= word_count <= 85:
                score += 5.0
                strengths.append({
                    "category": "Structure",
                    "title": "Concise Professional Summary",
                    "evidence": f"Summary is {word_count} words, ideal for rapid recruiter reading without overwhelming the page."
                })
            elif word_count > 85:
                score += 3.0
                issues.append({
                    "severity": "low",
                    "category": "Structure",
                    "title": "Overly Long Summary",
                    "description": f"Your summary is {word_count} words. Consider condensing to under 75 words for crisper scanning."
                })
            else:
                score += 2.5
                recommendations.append({
                    "category": "Structure",
                    "title": "Expand Professional Summary",
                    "suggestion": "Expand summary to 2-3 sentences highlighting your technical specialization and primary competencies."
                })
        else:
            recommendations.append({
                "category": "Structure",
                "title": "Add a Professional Summary",
                "suggestion": "A 2-3 sentence summary clarifies your career focus for automated ATS parsers."
            })

        # Check formatting consistency across items (5 pts)
        projects = data.get("projects", [])
        if projects and isinstance(projects, list):
            named_projects = [p for p in projects if isinstance(p, dict) and p.get("name")]
            if named_projects and len(named_projects) == len(projects):
                score += 5.0
            else:
                score += 2.5
        else:
            score += 2.5

        return {
            "score": min(25.0, score),
            "strengths": strengths,
            "issues": issues,
            "recommendations": recommendations
        }

    @classmethod
    def _evaluate_contact(cls, data: dict) -> dict:
        """Dimension B: Contact and Profile Completeness (15 points)."""
        score = 0.0
        strengths = []
        issues = []
        recommendations = []

        personal = data.get("personal", {})
        if not isinstance(personal, dict):
            personal = {}

        full_name = personal.get("fullName") or personal.get("full_name") or ""
        email = personal.get("email") or ""
        phone = personal.get("phone") or ""
        location = personal.get("location") or ""
        linkedin = personal.get("linkedin") or ""
        github = personal.get("github") or ""
        portfolio = personal.get("portfolio") or ""

        # 1. Full name (4 pts)
        if full_name and len(full_name.strip()) >= 3:
            score += 4.0
            strengths.append({
                "category": "Contact",
                "title": "Clear Candidate Identification",
                "evidence": f"Candidate name: '{full_name.strip()}'."
            })
        else:
            issues.append({
                "severity": "high",
                "category": "Contact",
                "title": "Candidate Name Missing",
                "description": "Please provide your full legal or professional name."
            })

        # 2. Email validity (4 pts)
        if email and re.match(r"[^@]+@[^@]+\.[^@]+", str(email).strip()):
            score += 4.0
        else:
            issues.append({
                "severity": "high",
                "category": "Contact",
                "title": "Valid Email Missing",
                "description": "A valid email address is required for recruiter correspondence."
            })

        # 3. Phone number (3 pts)
        clean_phone = re.sub(r"[^\d+]", "", str(phone))
        if clean_phone and len(clean_phone) >= 10:
            score += 3.0
        else:
            issues.append({
                "severity": "medium",
                "category": "Contact",
                "title": "Contact Phone Missing or Incomplete",
                "description": "Provide a phone number with country code for recruiter callback."
            })

        # 4. Professional online links (2 pts)
        has_links = bool(linkedin or github or portfolio)
        if has_links:
            score += 2.0
            strengths.append({
                "category": "Contact",
                "title": "Professional Web Profiles Provided",
                "evidence": "Includes professional portfolio or code repository links."
            })
        else:
            recommendations.append({
                "category": "Contact",
                "title": "Add GitHub or LinkedIn Profile",
                "suggestion": "Adding GitHub and LinkedIn URLs increases recruiter credibility by demonstrating actual work."
            })

        # 5. Location (2 pts)
        if location and len(str(location).strip()) >= 2:
            score += 2.0
        else:
            score += 1.0
            recommendations.append({
                "category": "Contact",
                "title": "Specify City / Location",
                "suggestion": "Include City, State or Country to help automated location filters match job locations."
            })

        return {
            "score": min(15.0, score),
            "strengths": strengths,
            "issues": issues,
            "recommendations": recommendations
        }

    @classmethod
    def _evaluate_relevance(cls, data: dict, target_role: str, target_jd: str) -> dict:
        """Dimension C: Target-Role Relevance (25 points)."""
        score = 0.0
        strengths = []
        issues = []
        recommendations = []
        mode = "targeted" if (target_role or target_jd) else "general"

        effective_role = (target_role or "Software Developer").strip()
        all_text = cls._extract_all_text(data).lower()
        role_tokens = [t.lower() for t in re.findall(r"\b[a-zA-Z]{3,}\b", effective_role) if t.lower() not in ["and", "the", "for", "with"]]

        # 1. Target role alignment in text / summary (10 pts)
        matches = [tok for tok in role_tokens if tok in all_text]
        if role_tokens and len(matches) == len(role_tokens):
            score += 10.0
            strengths.append({
                "category": "Relevance",
                "title": "Target Role Keyword Alignment",
                "evidence": f"Resume explicitly features target terms: {', '.join(matches)}."
            })
        elif matches:
            score += 7.0
            recommendations.append({
                "category": "Relevance",
                "title": "Reinforce Target Role Phrasing",
                "suggestion": f"Ensure your target role '{effective_role}' appears prominently in your summary and project titles."
            })
        else:
            score += 4.0
            issues.append({
                "severity": "medium",
                "category": "Relevance",
                "title": "Target Role Not Explicitly Mentioned",
                "description": f"Target title '{effective_role}' does not appear in your summary or project headlines."
            })

        # 2. Project & Experience relevance (10 pts)
        projects = data.get("projects", [])
        exp = data.get("experience", [])
        total_items = len(projects) + len(exp)
        if total_items >= 3:
            score += 10.0
            strengths.append({
                "category": "Relevance",
                "title": "Strong Practical Experience Baseline",
                "evidence": f"Contains {len(projects)} technical projects and {len(exp)} experience items."
            })
        elif total_items >= 1:
            score += 7.0
            recommendations.append({
                "category": "Relevance",
                "title": "Add More Practical Work Examples",
                "suggestion": "Include at least 2-3 substantive technical projects or internships aligned with your target specialization."
            })
        else:
            score += 2.0
            issues.append({
                "severity": "high",
                "category": "Relevance",
                "title": "Insufficient Practical Evidence",
                "description": "ATS and technical recruiters look for verifiable project work or internships demonstrating core skills."
            })

        # 3. Job Description Match (5 pts)
        if target_jd and len(target_jd.strip()) > 20:
            jd_terms = cls._extract_top_technical_keywords(target_jd)
            matched_jd_terms = [t for t in jd_terms if t.lower() in all_text]
            if jd_terms:
                coverage_pct = len(matched_jd_terms) / len(jd_terms)
                score += min(5.0, round(coverage_pct * 5.0, 1))
                if coverage_pct >= 0.6:
                    strengths.append({
                        "category": "Relevance",
                        "title": "High Job Description Synergy",
                        "evidence": f"Matches {len(matched_jd_terms)} of {len(jd_terms)} key technologies extracted from the job description."
                    })
                else:
                    recommendations.append({
                        "category": "Relevance",
                        "title": "Align With Unconfirmed Job Keywords",
                        "suggestion": "If you possess relevant skills requested in the job description, explicitly confirm and add them."
                    })
            else:
                score += 3.0
        else:
            # General assessment fallback
            score += 4.0

        return {
            "score": min(25.0, score),
            "strengths": strengths,
            "issues": issues,
            "recommendations": recommendations,
            "mode": mode
        }

    @classmethod
    def _evaluate_skills_and_keywords(cls, data: dict, target_role: str, target_jd: str) -> dict:
        """Dimension D: Skills and Keywords (20 points)."""
        score = 0.0
        strengths = []
        issues = []
        recommendations = []

        student_skills = cls._flatten_skills(data.get("skills"))
        student_skills_normalized = {s.lower(): s for s in student_skills}

        # 1. Skill diversity and quantity (10 pts)
        skill_count = len(student_skills)
        if skill_count >= 10:
            score += 10.0
            strengths.append({
                "category": "Skills",
                "title": "Well-Rounded Technical Toolkit",
                "evidence": f"{skill_count} confirmed technical skills across multiple categories."
            })
        elif skill_count >= 5:
            score += 7.5
        elif skill_count >= 2:
            score += 4.0
            issues.append({
                "severity": "medium",
                "category": "Skills",
                "title": "Limited Technical Skill Inventory",
                "description": f"Only {skill_count} skills listed. Most automated filters expect at least 6-8 relevant skills."
            })
        else:
            score += 1.0
            issues.append({
                "severity": "high",
                "category": "Skills",
                "title": "Crucial Technical Skills Missing",
                "description": "List programming languages, frameworks, databases, and developer tools you have used."
            })

        # 2. Keyword Coverage Analysis against Job Description or Target Role (10 pts)
        target_corpus = f"{target_role}\n{target_jd}" if target_jd else target_role
        target_keywords = cls._extract_top_technical_keywords(target_corpus)

        present = []
        related = []
        missing = []

        all_text = cls._extract_all_text(data).lower()

        for kw in target_keywords:
            kw_lower = kw.lower()
            if kw_lower in student_skills_normalized or f" {kw_lower} " in f" {all_text} ":
                present.append(kw)
            else:
                # Check related
                rel_synonyms = RELATED_SKILL_MAP.get(kw_lower, [])
                has_related = any(syn in student_skills_normalized or syn in all_text for syn in rel_synonyms)
                if has_related:
                    related.append(kw)
                else:
                    missing.append(kw)

        if target_keywords:
            match_pct = (len(present) + (len(related) * 0.5)) / len(target_keywords)
            score += min(10.0, round(match_pct * 10.0, 1))
        else:
            score += 8.0

        if missing:
            recommendations.append({
                "category": "Keywords",
                "title": "Review Target Role Keywords",
                "suggestion": f"The target role highlights: {', '.join(missing[:4])}. Only include these if you genuinely possess verified hands-on experience."
            })

        keyword_analysis = {
            "total_target_keywords": len(target_keywords),
            "present": present,
            "related": related,
            "missing_or_unconfirmed": missing,
            "match_percentage": round(((len(present) + (len(related) * 0.5)) / max(1, len(target_keywords))) * 100) if target_keywords else 100,
            "disclaimer": "Missing or unconfirmed keywords should only be added if you genuinely possess those skills."
        }

        return {
            "score": min(20.0, score),
            "strengths": strengths,
            "issues": issues,
            "recommendations": recommendations,
            "keyword_analysis": keyword_analysis
        }

    @classmethod
    def _evaluate_descriptions(cls, data: dict) -> dict:
        """Dimension E: Project and Experience Descriptions (15 points)."""
        score = 0.0
        strengths = []
        issues = []
        recommendations = []

        all_bullets = []
        projects = data.get("projects", [])
        if isinstance(projects, list):
            for p in projects:
                if isinstance(p, dict):
                    if p.get("description"):
                        all_bullets.append(str(p.get("description")))
                    if isinstance(p.get("responsibilities"), list):
                        all_bullets.extend([str(r) for r in p.get("responsibilities") if r])
                    if isinstance(p.get("bullets"), list):
                        all_bullets.extend([str(b) for b in p.get("bullets") if b])

        experience = data.get("experience", [])
        if isinstance(experience, list):
            for e in experience:
                if isinstance(e, dict):
                    if isinstance(e.get("responsibilities"), list):
                        all_bullets.extend([str(r) for r in e.get("responsibilities") if r])
                    if isinstance(e.get("achievements"), list):
                        all_bullets.extend([str(a) for a in e.get("achievements") if a])
                    if isinstance(e.get("bullets"), list):
                        all_bullets.extend([str(b) for b in e.get("bullets") if b])

        if not all_bullets:
            return {
                "score": 3.0,
                "strengths": [],
                "issues": [{
                    "severity": "high",
                    "category": "Descriptions",
                    "title": "No Project or Experience Descriptions",
                    "description": "Add detailed bullet points describing your technical contributions."
                }],
                "recommendations": [{
                    "category": "Descriptions",
                    "title": "Draft Technical Bullets",
                    "suggestion": "Describe what you built, what tools you used, and what specific responsibilities you held."
                }]
            }

        # 1. Action verbs detection (5 pts)
        verb_matches = 0
        for b in all_bullets:
            words = [w.lower().strip(".,;:()") for w in b.split()[:4]]
            if any(w in STRONG_ACTION_VERBS for w in words):
                verb_matches += 1

        action_verb_ratio = verb_matches / max(1, len(all_bullets))
        if action_verb_ratio >= 0.6:
            score += 5.0
            strengths.append({
                "category": "Descriptions",
                "title": "Strong Action Verb Usage",
                "evidence": f"{round(action_verb_ratio * 100)}% of bullets begin with powerful, impactful action verbs."
            })
        elif action_verb_ratio >= 0.3:
            score += 3.5
            recommendations.append({
                "category": "Descriptions",
                "title": "Strengthen Action Verbs",
                "suggestion": "Begin bullet points with active verbs like 'Architected', 'Implemented', 'Engineered', or 'Deployed'."
            })
        else:
            score += 1.5
            issues.append({
                "severity": "medium",
                "category": "Descriptions",
                "title": "Passive Phrasing in Bullets",
                "description": "Avoid passive phrasing such as 'worked on' or 'helped with'. Use decisive action verbs."
            })

        # 2. Bullet point length & structure (5 pts)
        ideal_length_count = sum(1 for b in all_bullets if 40 <= len(b.strip()) <= 240)
        length_ratio = ideal_length_count / max(1, len(all_bullets))
        if length_ratio >= 0.7:
            score += 5.0
            strengths.append({
                "category": "Descriptions",
                "title": "Well-Proportioned Bullet Structure",
                "evidence": "Bullet points are concise, scannable, and avoid paragraph bloat."
            })
        else:
            score += 3.0
            recommendations.append({
                "category": "Descriptions",
                "title": "Optimize Bullet Point Length",
                "suggestion": "Keep bullet points between 1 and 3 lines (40 to 200 characters) for optimal readability."
            })

        # 3. Grounded Technical Specificity (5 pts)
        # Check if technical tools / technologies are mentioned inside bullets
        tech_catalogs = ["api", "database", "python", "react", "sql", "test", "server", "model", "cloud", "ui", "algorithm", "architecture"]
        tech_bullets = sum(1 for b in all_bullets if any(t in b.lower() for t in tech_catalogs))
        if tech_bullets >= 2:
            score += 5.0
            strengths.append({
                "category": "Descriptions",
                "title": "Technically Grounded Descriptions",
                "evidence": "Project bullets explicitly reference tools, architectures, or technical deliverables."
            })
        else:
            score += 2.5
            recommendations.append({
                "category": "Descriptions",
                "title": "Mention Specific Technologies",
                "suggestion": "Mention the exact libraries, databases, or frameworks you used when explaining each project."
            })

        return {
            "score": min(15.0, score),
            "strengths": strengths,
            "issues": issues,
            "recommendations": recommendations
        }

    @classmethod
    def _flatten_skills(cls, skills_obj: Any) -> List[str]:
        """Collects all skill strings from dictionary or list."""
        res = []
        if isinstance(skills_obj, list):
            for s in skills_obj:
                if isinstance(s, str) and s.strip():
                    res.append(s.strip())
                elif isinstance(s, dict) and s.get("name"):
                    res.append(str(s["name"]).strip())
        elif isinstance(skills_obj, dict):
            for v in skills_obj.values():
                if isinstance(v, list):
                    for s in v:
                        if isinstance(s, str) and s.strip():
                            res.append(s.strip())
                        elif isinstance(s, dict) and s.get("name"):
                            res.append(str(s["name"]).strip())
        return list(dict.fromkeys(res))

    @classmethod
    def _extract_all_text(cls, data: dict) -> str:
        """Flattens all resume fields into a single string for keyword analysis."""
        parts = []
        personal = data.get("personal", {})
        if isinstance(personal, dict):
            for v in personal.values():
                if isinstance(v, str):
                    parts.append(v)
        if data.get("summary"):
            parts.append(str(data["summary"]))
        parts.extend(cls._flatten_skills(data.get("skills")))
        for p in data.get("projects", []):
            if isinstance(p, dict):
                parts.append(p.get("name", ""))
                parts.append(p.get("description", ""))
                parts.extend(p.get("technologies", []))
        for e in data.get("experience", []):
            if isinstance(e, dict):
                parts.append(e.get("role", ""))
                parts.append(e.get("organization", ""))
                parts.append(e.get("company", ""))
                parts.extend(e.get("responsibilities", []))
                parts.extend(e.get("bullets", []))
        return " ".join([p for p in parts if p])

    @classmethod
    def _extract_top_technical_keywords(cls, text: str) -> List[str]:
        """Extracts recognizable technical skills and domain terms from text."""
        if not text:
            return []
        catalog = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "Express", "Flask",
            "Django", "FastAPI", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker",
            "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "REST APIs", "GraphQL",
            "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Pandas",
            "Data Structures", "Algorithms", "CI/CD", "Linux", "SQL", "NoSQL", "Next.js",
            "Java", "C++", "C#", "Spring Boot", "Microservices", "System Design"
        ]
        found = []
        for kw in catalog:
            pattern = r"\b" + re.escape(kw) + r"\b"
            if re.search(pattern, text, re.IGNORECASE):
                found.append(kw)
        return found
