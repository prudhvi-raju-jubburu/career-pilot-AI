from typing import List, Dict, Any

class ResumeTemplateService:
    """
    Catalog and configuration service for the professional resume template library.
    Defines layout rules, ATS compatibility ratings, section ordering, and styling tokens.
    """

    TEMPLATES = [
        {
            "id": "ats_classic",
            "name": "ATS Classic",
            "tagline": "Single column, clean lines, maximum automated screening compatibility",
            "ats_compatibility": "Maximum (99%)",
            "recommended_for": "Conventional corporate portals, Workday, Taleo, Greenhouse, and enterprise ATS",
            "category": "General & Enterprise",
            "layout": "single_column",
            "default_accent": "#0f172a",
            "supported_accents": ["#0f172a", "#1e3a8a", "#047857", "#4338ca", "#334155"],
            "section_order": ["summary", "education", "skills", "experience", "projects", "certifications", "achievements"],
            "features": [
                "Strict single-column flow",
                "Standard standard-compliant section headers",
                "Zero complex table wrappers",
                "Universal parser friendly"
            ]
        },
        {
            "id": "modern_professional",
            "name": "Modern Professional",
            "tagline": "Elegant typography, subtle accent highlights, and balanced whitespace",
            "ats_compatibility": "High (95%)",
            "recommended_for": "Fast-growing tech companies, consulting, and modern engineering firms",
            "category": "Professional Tech",
            "layout": "single_column",
            "default_accent": "#2563eb",
            "supported_accents": ["#2563eb", "#0284c7", "#059669", "#7c3aed", "#ea580c"],
            "section_order": ["summary", "skills", "experience", "projects", "education", "certifications"],
            "features": [
                "Subtle left border accents",
                "High-contrast section typography",
                "Clean technical skill matrices",
                "Recruiter-friendly reading cadence"
            ]
        },
        {
            "id": "software_engineer",
            "name": "Software Engineer",
            "tagline": "Technical skills & GitHub front and center, architected for developers",
            "ats_compatibility": "High (96%)",
            "recommended_for": "Full-Stack, Backend, Frontend, and Systems Engineering roles",
            "category": "Engineering",
            "layout": "single_column",
            "default_accent": "#0f766e",
            "supported_accents": ["#0f766e", "#1d4ed8", "#4338ca", "#be123c", "#334155"],
            "section_order": ["skills", "projects", "experience", "education", "certifications"],
            "features": [
                "Categorized technical skill grid at top",
                "Detailed project stacks with live repo links",
                "System architecture focus",
                "Streamlined education section"
            ]
        },
        {
            "id": "ai_ml_data",
            "name": "AI/ML and Data",
            "tagline": "Highlights models, data pipelines, mathematics, and research projects",
            "ats_compatibility": "High (94%)",
            "recommended_for": "Machine Learning Engineer, Data Scientist, and AI Researcher applications",
            "category": "Data & AI",
            "layout": "single_column",
            "default_accent": "#6d28d9",
            "supported_accents": ["#6d28d9", "#2563eb", "#0d9488", "#b91c1c", "#1e293b"],
            "section_order": ["summary", "skills", "projects", "education", "experience", "certifications"],
            "features": [
                "Machine Learning & Data framework emphasis",
                "Research/Project methodology highlights",
                "Specialized math/coursework indicators",
                "Kaggle/Dataset/Paper reference slots"
            ]
        },
        {
            "id": "student_fresher",
            "name": "Student / Fresher",
            "tagline": "Balances education, coursework, academic builds, and campus hackathons",
            "ats_compatibility": "High (97%)",
            "recommended_for": "College graduates, campus placements, and junior associate hiring",
            "category": "Campus & Entry-Level",
            "layout": "single_column",
            "default_accent": "#1e3a8a",
            "supported_accents": ["#1e3a8a", "#0369a1", "#047857", "#6b21a8", "#374151"],
            "section_order": ["education", "skills", "projects", "certifications", "achievements", "experience"],
            "features": [
                "Degree, CGPA & coursework upfront",
                "Academic & personal capstone projects",
                "Hackathon & coding rank showcases",
                "Zero penalty for no full-time experience"
            ]
        },
        {
            "id": "internship_focus",
            "name": "Internship Focus",
            "tagline": "Targeted alignment for summer, winter, and co-op technical internships",
            "ats_compatibility": "High (96%)",
            "recommended_for": "Undergraduates applying for competitive tech internships",
            "category": "Internship",
            "layout": "single_column",
            "default_accent": "#047857",
            "supported_accents": ["#047857", "#1d4ed8", "#b45309", "#0f172a", "#581c87"],
            "section_order": ["summary", "education", "skills", "projects", "experience", "achievements"],
            "features": [
                "Immediate target-role objective line",
                "Project responsibilities and technical learnings",
                "Relevant coursework and academic strengths",
                "Clear graduation timeline visibility"
            ]
        }
    ]

    @classmethod
    def list_templates(cls) -> List[Dict[str, Any]]:
        """Returns catalog of all available professional resume templates."""
        return cls.TEMPLATES

    @classmethod
    def get_template(cls, template_id: str) -> Dict[str, Any]:
        """Fetches a specific template by ID, falling back to ATS Classic."""
        for t in cls.TEMPLATES:
            if t["id"] == template_id:
                return t
        return cls.TEMPLATES[0]
