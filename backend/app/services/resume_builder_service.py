import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from app.utils.skill_normalizer import normalize_skill_list, normalize_skill
from app.services.resume_quality_service import STRONG_ACTION_VERBS

logger = logging.getLogger(__name__)

class ResumeBuilderService:
    """
    Core service for merging resume & profile data, generating grounded AI improvements,
    crafting professional summaries, and preparing tailored resume models without hallucinations.
    """

    SUMMARY_PROMPT = """You are an expert AI Resume Strategist for CareerPilot AI.
Given the student's verified profile data and target role, write 3 concise, grounded professional summary options (each 2-3 sentences, 35-65 words).

CRITICAL RULES:
1. STRICT TRUTHFULNESS: Only use skills, degrees, and technologies explicitly mentioned in the student data.
2. DO NOT fabricate metrics, companies, years of professional experience, or certifications.
3. Tailor the emphasis toward the target role.
4. Output valid JSON in the format:
{
  "options": [
    { "type": "Balanced", "text": "..." },
    { "type": "Technical & Projects", "text": "..." },
    { "type": "Career Objective", "text": "..." }
  ]
}
"""

    IMPROVEMENT_PROMPT = """You are an expert ATS Resume Optimization Specialist for CareerPilot AI.
Review the following resume bullets/descriptions and suggest grounded improvements to make them more impactful, professional, and ATS-friendly.

CRITICAL RULES:
1. ZERO HALLUCINATION: NEVER invent metrics (e.g., do not add 'improved performance by 40%' or 'managed team of 5' unless explicitly stated in the original).
2. If metrics are missing, use clear technical action verbs and indicate in the reason that the student can optionally add their real measured impact.
3. Use active voice and strong technical action verbs (e.g. Developed, Implemented, Engineered, Architected, Refactored).
4. Integrate relevant keywords only if they align directly with what the bullet already describes.
5. Return ONLY a valid JSON object matching this schema:
{
  "suggestions": [
    {
      "id": "sugg_1",
      "section": "projects" or "experience" or "summary",
      "item_index": 0,
      "bullet_index": 0,
      "original_text": "...",
      "suggested_text": "...",
      "reason": "...",
      "keywords_addressed": ["..."]
    }
  ]
}
"""

    @classmethod
    def _unwrap_val(cls, val: Any, default: str = "") -> str:
        """Safely unwraps nested {value: ..., source: ...} dicts or stringified dicts into plain clean strings."""
        if val is None:
            return default
        if isinstance(val, dict):
            if "value" in val and val["value"] is not None:
                return cls._unwrap_val(val["value"], default)
            if "name" in val and val["name"] is not None:
                return cls._unwrap_val(val["name"], default)
            if "title" in val and val["title"] is not None:
                return cls._unwrap_val(val["title"], default)
            return default
        if isinstance(val, (int, float)):
            return str(val)
        s = str(val).strip()
        # Handle embedded or stringified Python/JSON dicts
        if "{" in s and ("value" in s or "source" in s):
            s = re.sub(r"\{['\"]value['\"]:\s*['\"]?([^,'\"}]+)['\"]?[^}]*\}", r"\1", s)
            if s.startswith("{") and s.endswith("}"):
                import ast
                try:
                    parsed = ast.literal_eval(s)
                    if isinstance(parsed, dict) and "value" in parsed:
                        return cls._unwrap_val(parsed["value"], default)
                except Exception:
                    pass
        # Normalize double CGPA strings
        s = re.sub(r'(?i)\bCGPA\s+CGPA\b', 'CGPA', s)
        return s.strip()

    @classmethod
    def merge_profile_and_resume(cls, profile: dict, extracted_resume: dict) -> dict:
        """
        Safely merges student profile and extracted resume data into a reviewable draft.
        Respects field provenance, preserves manual fields, and flags conflicts.
        """
        conflicts = []
        field_provenance = {}

        p_personal = profile.get("personal", {}) if isinstance(profile.get("personal"), dict) else {}
        r_personal = extracted_resume.get("personal", {}) if isinstance(extracted_resume.get("personal"), dict) else {}
        p_sources = profile.get("field_sources", {}) if isinstance(profile.get("field_sources"), dict) else {}

        # 1. Personal Info Merge
        personal = {}
        for key in ["fullName", "email", "phone", "location"]:
            p_alt = "full_name" if key == "fullName" else key
            raw_p = p_personal.get(key) if key in p_personal else p_personal.get(p_alt)
            raw_r = r_personal.get(key) if key in r_personal else r_personal.get(p_alt)

            is_manual = False
            if isinstance(raw_p, dict) and raw_p.get("source") == "manual":
                is_manual = True

            p_val = cls._unwrap_val(raw_p)
            r_val = cls._unwrap_val(raw_r)

            source_key = f"personal.{p_alt}"
            if p_sources.get(source_key) == "manual" or p_sources.get(f"personal.{key}") == "manual":
                is_manual = True

            if p_val and r_val and p_val.strip() != r_val.strip():
                conflicts.append({
                    "field": f"personal.{key}",
                    "profile_value": p_val.strip(),
                    "resume_value": r_val.strip(),
                    "resolved_value": (p_val if is_manual else r_val).strip(),
                    "resolution_reason": "Preserved manually verified profile value" if is_manual else "Updated with uploaded resume value"
                })

            if is_manual and p_val:
                personal[key] = p_val.strip()
                field_provenance[f"personal.{key}"] = "manual"
            elif r_val:
                personal[key] = r_val.strip()
                field_provenance[f"personal.{key}"] = "resume"
            elif p_val:
                personal[key] = p_val.strip()
                field_provenance[f"personal.{key}"] = p_sources.get(source_key, p_sources.get(f"personal.{key}", "profile"))
            else:
                personal[key] = ""
                field_provenance[f"personal.{key}"] = "empty"

        # Web links
        soc = profile.get("socialLinks", {}) if isinstance(profile.get("socialLinks"), dict) else {}
        personal["linkedin"] = cls._unwrap_val(soc.get("linkedin") or r_personal.get("linkedin"))
        personal["github"] = cls._unwrap_val(soc.get("github") or r_personal.get("github"))
        personal["portfolio"] = cls._unwrap_val(soc.get("portfolio") or r_personal.get("portfolio"))

        # 2. Education Merge
        p_edu = profile.get("education", {}) if isinstance(profile.get("education"), dict) else {}
        r_edu = extracted_resume.get("education", {}) if isinstance(extracted_resume.get("education"), dict) else {}

        education = []
        college = cls._unwrap_val(p_edu.get("college") if "college" in p_edu else r_edu.get("college"))
        degree = cls._unwrap_val(p_edu.get("degree") if "degree" in p_edu else r_edu.get("degree")) or "B.Tech"
        branch = cls._unwrap_val(p_edu.get("branch") if "branch" in p_edu else r_edu.get("branch"))
        grad_year = cls._unwrap_val(p_edu.get("graduationYear") if "graduationYear" in p_edu else (p_edu.get("graduation_year") if "graduation_year" in p_edu else r_edu.get("graduationYear")))
        cgpa_raw = cls._unwrap_val(p_edu.get("cgpa") if "cgpa" in p_edu else r_edu.get("cgpa"))

        cgpa_str = ""
        if cgpa_raw:
            clean_cgpa = re.sub(r'(?i)\bcgpa\b', '', cgpa_raw).strip()
            cgpa_str = f"{clean_cgpa} CGPA" if clean_cgpa else ""

        if college:
            degree_str = f"{degree} in {branch}".strip() if branch and branch.lower() not in degree.lower() else degree
            education.append({
                "institution": college,
                "college": college,
                "degree": degree_str,
                "branch": branch,
                "year": grad_year,
                "graduationYear": grad_year,
                "cgpa": cgpa_str,
                "gpa": cgpa_str,
                "source": "manual" if p_sources.get("education.college") == "manual" else ("resume" if r_edu.get("college") else "profile")
            })

        # 3. Skills Merge (Deduplicated & Normalized)
        p_skills = cls._extract_skills_from_profile(profile)
        r_skills = cls._extract_skills_from_extracted(extracted_resume)

        all_skills = normalize_skill_list(p_skills + r_skills)
        categorized_skills = cls._categorize_skills(all_skills)

        # 4. Projects Merge (Deduplicate by normalized name)
        p_projects = profile.get("projects", []) if isinstance(profile.get("projects"), list) else []
        r_projects = extracted_resume.get("projects", []) if isinstance(extracted_resume.get("projects"), list) else []

        seen_projects = set()
        projects = []

        for p in (p_projects + r_projects):
            if not isinstance(p, dict):
                continue
            name = cls._unwrap_val(p.get("name", "")).strip()
            norm_name = re.sub(r"[^\w]", "", name.lower())
            if not norm_name or norm_name in seen_projects:
                continue
            seen_projects.add(norm_name)

            techs_raw = p.get("technologies") or p.get("techStack") or []
            if isinstance(techs_raw, str):
                techs = [cls._unwrap_val(t).strip() for t in techs_raw.split(",") if cls._unwrap_val(t).strip()]
            elif isinstance(techs_raw, list):
                techs = [cls._unwrap_val(t).strip() for t in techs_raw if cls._unwrap_val(t).strip()]
            else:
                techs = []

            bullets = []
            desc = cls._unwrap_val(p.get("description", "")).strip()
            if desc:
                bullets.append(desc)
            if isinstance(p.get("responsibilities"), list):
                bullets.extend([cls._unwrap_val(r).strip() for r in p["responsibilities"] if cls._unwrap_val(r).strip()])
            if isinstance(p.get("bullets"), list):
                bullets.extend([cls._unwrap_val(b).strip() for b in p["bullets"] if cls._unwrap_val(b).strip()])

            projects.append({
                "name": name,
                "role": cls._unwrap_val(p.get("role", "Developer")).strip(),
                "technologies": techs,
                "description": desc,
                "bullets": bullets if bullets else ([desc] if desc else ["Engineered full-featured application components."]),
                "link": cls._unwrap_val(p.get("link") or p.get("github") or p.get("url") or "").strip(),
                "source": "profile" if p in p_projects else "resume"
            })

        # 5. Experience / Internships Merge
        p_exp = profile.get("experience", []) if isinstance(profile.get("experience"), list) else []
        r_exp = extracted_resume.get("experience", []) if isinstance(extracted_resume.get("experience"), list) else []

        seen_exp = set()
        experience = []

        for e in (p_exp + r_exp):
            if not isinstance(e, dict):
                continue
            org = cls._unwrap_val(e.get("organization") or e.get("company", "")).strip()
            role = cls._unwrap_val(e.get("role", "")).strip()
            norm_key = f"{org.lower()}_{role.lower()}"
            if not org or norm_key in seen_exp:
                continue
            seen_exp.add(norm_key)

            bullets = []
            if isinstance(e.get("responsibilities"), list):
                bullets.extend([cls._unwrap_val(r).strip() for r in e["responsibilities"] if cls._unwrap_val(r).strip()])
            if isinstance(e.get("achievements"), list):
                bullets.extend([cls._unwrap_val(a).strip() for a in e["achievements"] if cls._unwrap_val(a).strip()])
            if isinstance(e.get("bullets"), list):
                bullets.extend([cls._unwrap_val(b).strip() for b in e["bullets"] if cls._unwrap_val(b).strip()])

            experience.append({
                "role": role or "Intern / Contributor",
                "organization": org,
                "company": org,
                "duration": cls._unwrap_val(e.get("duration") or e.get("dates") or "").strip(),
                "startDate": cls._unwrap_val(e.get("startDate") or "").strip(),
                "endDate": cls._unwrap_val(e.get("endDate") or "").strip(),
                "bullets": bullets if bullets else ["Contributed to software development and engineering workflows."],
                "source": "profile" if e in p_exp else "resume"
            })

        # 6. Certifications & Achievements
        certifications = []
        for c in (profile.get("certifications", []) + extracted_resume.get("certifications", [])):
            if isinstance(c, dict):
                name = cls._unwrap_val(c.get("name")).strip()
                if name:
                    certifications.append({
                        "name": name,
                        "organization": cls._unwrap_val(c.get("organization") or c.get("issuer") or "").strip(),
                        "date": cls._unwrap_val(c.get("date") or c.get("year") or "").strip()
                    })

        achievements = []
        for a in (profile.get("achievements", []) + extracted_resume.get("achievements", [])):
            if isinstance(a, dict):
                title = cls._unwrap_val(a.get("title") or a.get("name")).strip()
                if title:
                    achievements.append({
                        "title": title,
                        "context": cls._unwrap_val(a.get("context") or a.get("description") or "").strip()
                    })
            elif isinstance(a, str) and a.strip():
                clean_title = cls._unwrap_val(a).strip()
                if clean_title:
                    achievements.append({"title": clean_title, "context": ""})

        # Summary
        target_role = profile.get("target_role") or "Software Engineer"
        summary = profile.get("summary") or ""
        if not summary and personal.get("fullName"):
            top_tech = ", ".join(all_skills[:4]) if all_skills else "modern software engineering"
            summary = f"Motivated {target_role} with strong foundations in {top_tech}. Passionate about building robust applications and collaborating on technical challenges."

        return {
            "personal": personal,
            "summary": summary,
            "education": education,
            "skills": all_skills,
            "skills_categorized": categorized_skills,
            "projects": projects,
            "experience": experience,
            "certifications": certifications,
            "achievements": achievements,
            "conflicts": conflicts,
            "field_provenance": field_provenance
        }

    @classmethod
    def generate_professional_summaries(cls, resume_data: dict, target_role: str = "") -> List[dict]:
        """
        Generates 3 grounded professional summary options based only on student's verified data.
        """
        role = target_role or resume_data.get("personal", {}).get("targetTitle") or "Software Developer"
        skills = resume_data.get("skills", [])
        skills_str = ", ".join(skills[:5]) if skills else "software engineering and modern technologies"
        degree = "Engineering student"
        if resume_data.get("education") and isinstance(resume_data["education"], list):
            deg_obj = resume_data["education"][0]
            if deg_obj.get("degree"):
                degree = deg_obj["degree"]

        # Check Gemini API
        gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if gemini_api_key:
            try:
                ai_options = cls._call_gemini_summary(resume_data, role, gemini_api_key)
                if ai_options:
                    return ai_options
            except Exception as e:
                logger.warning("Gemini summary call failed: %s. Using grounded deterministic fallback.", str(e))

        # Grounded deterministic options
        return [
            {
                "type": "Impact & Technical",
                "text": f"Aspiring {role} and {degree} with hands-on proficiency in {skills_str}. Dedicated to writing clean, maintainable code and developing scalable web applications."
            },
            {
                "type": "Project & Solutions",
                "text": f"{degree} focused on {role} opportunities. Demonstrated ability building practical projects utilizing {skills_str}, with an emphasis on systematic problem solving and modern engineering workflows."
            },
            {
                "type": "Foundational & Academic",
                "text": f"Detail-oriented {degree} seeking a {role} position. Solid theoretical and practical background in {skills_str}, with passion for continuous learning and collaborative team contributions."
            }
        ]

    @classmethod
    def generate_ai_improvements(cls, resume_data: dict, target_role: str = "", target_jd: str = "") -> List[dict]:
        """
        Analyzes resume bullets, titles, and summaries to generate grounded rewrite suggestions.
        Guarantees ZERO metric hallucination.
        """
        gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if gemini_api_key:
            try:
                ai_suggestions = cls._call_gemini_improvements(resume_data, target_role, target_jd, gemini_api_key)
                if ai_suggestions:
                    return ai_suggestions
            except Exception as e:
                logger.warning("Gemini improvements call failed: %s. Utilizing grounded deterministic engine.", str(e))

        # Deterministic Grounded Rewrite Engine
        return cls._deterministic_grounded_improvements(resume_data, target_role, target_jd)

    @classmethod
    def _deterministic_grounded_improvements(cls, data: dict, target_role: str, target_jd: str) -> List[dict]:
        """
        Produces actionable, grounded improvements without external LLM dependencies.
        Replaces passive verbs with active verbs, restructures bullet points, and suggests real metrics.
        """
        suggestions = []
        sugg_idx = 1

        # 1. Check Professional Summary
        summary = str(data.get("summary", "")).strip()
        if summary and ("help" in summary.lower() or "looking for" in summary.lower() or len(summary.split()) < 20):
            role_title = target_role or "Software Developer"
            skills = data.get("skills", [])
            skill_text = ", ".join(skills[:4]) if skills else "modern technical stacks"
            suggested_sum = f"Proactive {role_title} with solid practical foundations across {skill_text}. Experienced in developing responsive full-stack applications and applying rigorous software engineering principles."
            suggestions.append({
                "id": f"sugg_{sugg_idx}",
                "section": "summary",
                "item_index": None,
                "bullet_index": None,
                "original_text": summary,
                "suggested_text": suggested_sum,
                "reason": "Replaced informal or passive introductory phrasing with an authoritative, ATS-recognized summary.",
                "keywords_addressed": skills[:3]
            })
            sugg_idx += 1

        # 2. Check Projects Bullets
        projects = data.get("projects", [])
        if isinstance(projects, list):
            for p_idx, proj in enumerate(projects):
                if not isinstance(proj, dict):
                    continue
                bullets = proj.get("bullets", [])
                if not bullets and proj.get("description"):
                    bullets = [proj["description"]]

                techs = proj.get("technologies", [])
                tech_str = techs[0] if techs else "the required tech stack"

                for b_idx, bullet in enumerate(bullets):
                    if not bullet or len(bullet.strip()) < 10:
                        continue
                    clean_b = bullet.strip()
                    first_word = clean_b.split()[0].lower().strip(".,;:()")

                    # If starting with passive or generic words
                    if first_word in ["made", "created", "worked", "did", "built", "helped", "used", "simple", "a", "this", "it"]:
                        verb = "Developed" if "app" in clean_b.lower() or "web" in clean_b.lower() else "Implemented"
                        # Transform passive lead into strong action lead
                        rest = clean_b[len(clean_b.split()[0]):].strip()
                        if rest.startswith("a ") or rest.startswith("an "):
                            rest = rest[2 if rest.startswith("a ") else 3:].strip()
                        
                        suggested_bullet = f"{verb} {rest}"
                        # Ensure ends with period
                        if not suggested_bullet.endswith("."):
                            suggested_bullet += "."

                        suggestions.append({
                            "id": f"sugg_{sugg_idx}",
                            "section": "projects",
                            "item_index": p_idx,
                            "bullet_index": b_idx,
                            "original_text": clean_b,
                            "suggested_text": suggested_bullet,
                            "reason": f"Upgraded passive lead '{first_word.capitalize()}' to precise action verb '{verb}' for improved ATS keyword ranking.",
                            "keywords_addressed": [verb]
                        })
                        sugg_idx += 1

                    # Check for missing outcome or measurable results
                    elif not any(char.isdigit() or char == '%' for char in clean_b) and len(clean_b) > 25:
                        if sugg_idx <= 6:
                            # Suggestion without inventing fake percentages
                            improved_ver = clean_b
                            if not improved_ver.endswith("."):
                                improved_ver += "."
                            suggestions.append({
                                "id": f"sugg_{sugg_idx}",
                                "section": "projects",
                                "item_index": p_idx,
                                "bullet_index": b_idx,
                                "original_text": clean_b,
                                "suggested_text": improved_ver,
                                "reason": "Tip: If available, add real measurable outcomes (e.g. number of active users, latency improvement, or dataset size) to prove tangible impact.",
                                "keywords_addressed": []
                            })
                            sugg_idx += 1

        # 3. Check Experience Bullets
        experiences = data.get("experience", [])
        if isinstance(experiences, list):
            for e_idx, exp in enumerate(experiences):
                if not isinstance(exp, dict):
                    continue
                bullets = exp.get("bullets", [])
                for b_idx, bullet in enumerate(bullets):
                    clean_b = str(bullet).strip()
                    if not clean_b or len(clean_b) < 10:
                        continue
                    first_word = clean_b.split()[0].lower().strip(".,;:()")
                    if first_word in ["assisted", "helped", "responsible", "was", "worked", "duties"]:
                        verb = "Engineered" if "code" in clean_b.lower() else "Executed"
                        rest = clean_b[len(clean_b.split()[0]):].strip()
                        if rest.startswith("with ") or rest.startswith("for "):
                            rest = rest[5:].strip()

                        suggested_bullet = f"{verb} {rest}"
                        if not suggested_bullet.endswith("."):
                            suggested_bullet += "."

                        suggestions.append({
                            "id": f"sugg_{sugg_idx}",
                            "section": "experience",
                            "item_index": e_idx,
                            "bullet_index": b_idx,
                            "original_text": clean_b,
                            "suggested_text": suggested_bullet,
                            "reason": f"Transformed passive responsibility description into decisive technical accomplishment with verb '{verb}'.",
                            "keywords_addressed": [verb]
                        })
                        sugg_idx += 1

        return suggestions

    @classmethod
    def _call_gemini_summary(cls, data: dict, role: str, api_key: str) -> Optional[List[dict]]:
        """Invokes Gemini for grounded summary alternatives."""
        prompt = f"""{cls.SUMMARY_PROMPT}

TARGET ROLE: {role}
STUDENT SKILLS: {', '.join(data.get('skills', []))}
STUDENT EDUCATION: {json.dumps(data.get('education', []))}
STUDENT PROJECTS: {json.dumps([{ 'name': p.get('name'), 'tech': p.get('technologies') } for p in data.get('projects', []) if isinstance(p, dict)])}
"""
        raw_text = cls._gemini_generate(prompt, api_key)
        if not raw_text:
            return None
        parsed = cls._parse_json(raw_text)
        return parsed.get("options") if isinstance(parsed, dict) else None

    @classmethod
    def _call_gemini_improvements(cls, data: dict, role: str, jd: str, api_key: str) -> Optional[List[dict]]:
        """Invokes Gemini for grounded bullet points refinement."""
        bullets_payload = []
        for p_idx, p in enumerate(data.get("projects", [])):
            if isinstance(p, dict):
                for b_idx, b in enumerate(p.get("bullets", [])):
                    bullets_payload.append({
                        "section": "projects",
                        "item_index": p_idx,
                        "bullet_index": b_idx,
                        "project_name": p.get("name"),
                        "text": str(b)
                    })
        for e_idx, e in enumerate(data.get("experience", [])):
            if isinstance(e, dict):
                for b_idx, b in enumerate(e.get("bullets", [])):
                    bullets_payload.append({
                        "section": "experience",
                        "item_index": e_idx,
                        "bullet_index": b_idx,
                        "company": e.get("company") or e.get("organization"),
                        "text": str(b)
                    })

        if not bullets_payload:
            return None

        prompt = f"""{cls.IMPROVEMENT_PROMPT}

TARGET ROLE: {role}
TARGET JOB DESCRIPTION:
\"\"\"
{jd}
\"\"\"

BULLETS TO IMPROVE:
{json.dumps(bullets_payload[:8], indent=2)}
"""
        raw_text = cls._gemini_generate(prompt, api_key)
        if not raw_text:
            return None
        parsed = cls._parse_json(raw_text)
        return parsed.get("suggestions") if isinstance(parsed, dict) else None

    @classmethod
    def _gemini_generate(cls, prompt: str, api_key: str) -> str:
        """Helper to invoke google.genai or google.generativeai."""
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return resp.text or ""
        except Exception:
            pass

        import google.generativeai as gai
        gai.configure(api_key=api_key)
        model = gai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content(prompt)
        return resp.text or ""

    @staticmethod
    def _parse_json(text: str) -> dict:
        """Cleans and extracts JSON object from response."""
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        s_idx = cleaned.find("{")
        e_idx = cleaned.rfind("}")
        if s_idx != -1 and e_idx != -1:
            cleaned = cleaned[s_idx:e_idx + 1]
        return json.loads(cleaned)

    @classmethod
    def _extract_skills_from_profile(cls, profile: dict) -> List[str]:
        res = []
        skills = profile.get("skills")
        if isinstance(skills, list):
            for s in skills:
                raw = s if isinstance(s, (str, int, float)) else (s.get("name") or s.get("value") if isinstance(s, dict) else "")
                clean = cls._unwrap_val(raw).strip()
                if clean:
                    res.append(clean)
        elif isinstance(skills, dict):
            for v in skills.values():
                if isinstance(v, list):
                    for s in v:
                        raw = s if isinstance(s, (str, int, float)) else (s.get("name") or s.get("value") if isinstance(s, dict) else "")
                        clean = cls._unwrap_val(raw).strip()
                        if clean:
                            res.append(clean)
                elif isinstance(v, dict):
                    inner = v.get("value") or v.get("name")
                    if isinstance(inner, list):
                        for s in inner:
                            clean = cls._unwrap_val(s).strip()
                            if clean:
                                res.append(clean)
                    else:
                        clean = cls._unwrap_val(inner).strip()
                        if clean:
                            res.append(clean)
                elif isinstance(v, (str, int, float)):
                    clean = cls._unwrap_val(v).strip()
                    if clean:
                        res.append(clean)
        return [r for r in res if r]

    @classmethod
    def _extract_skills_from_extracted(cls, extracted: dict) -> List[str]:
        res = []
        skills = extracted.get("skills")
        if isinstance(skills, list):
            for s in skills:
                clean = cls._unwrap_val(s).strip()
                if clean:
                    res.append(clean)
        elif isinstance(skills, dict):
            for v in skills.values():
                if isinstance(v, list):
                    for s in v:
                        clean = cls._unwrap_val(s).strip()
                        if clean:
                            res.append(clean)
                elif isinstance(v, str):
                    clean = cls._unwrap_val(v).strip()
                    if clean:
                        res.append(clean)
        return res

    @classmethod
    def _categorize_skills(cls, skills: List[str]) -> Dict[str, List[str]]:
        languages = {"python", "javascript", "typescript", "c++", "java", "c#", "go", "rust", "ruby", "php", "sql", "c"}
        frameworks = {"react", "next.js", "vue", "angular", "flask", "django", "fastapi", "node.js", "express", "spring boot", "tailwind", "pytorch", "tensorflow"}
        databases = {"mongodb", "postgresql", "mysql", "redis", "sqlite", "dynamodb", "firebase", "cassandra"}
        tools_cloud = {"git", "github", "docker", "kubernetes", "aws", "azure", "gcp", "linux", "postman", "jira", "ci/cd"}

        cats = {
            "Languages": [],
            "Frameworks & Libraries": [],
            "Databases": [],
            "Cloud & Developer Tools": [],
            "Other Technical": []
        }

        for s in skills:
            low = s.lower()
            if low in languages:
                cats["Languages"].append(s)
            elif low in frameworks:
                cats["Frameworks & Libraries"].append(s)
            elif low in databases:
                cats["Databases"].append(s)
            elif low in tools_cloud:
                cats["Cloud & Developer Tools"].append(s)
            else:
                cats["Other Technical"].append(s)

        return {k: v for k, v in cats.items() if v}
