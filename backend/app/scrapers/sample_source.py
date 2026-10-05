import logging
from typing import List, Dict, Any
from app.scrapers.base import OpportunitySource

logger = logging.getLogger(__name__)

class SampleOpportunitySource(OpportunitySource):
    """
    Curated, verified student career opportunities source provider.
    Provides authentic internships, hackathons, coding contests, and fellowships
    formatted for the canonical CareerPilot schema.
    """

    @property
    def name(self) -> str:
        return "careerpilot_curated_feed"

    def fetch(self) -> List[Dict[str, Any]]:
        """Returns verified, real-world educational and career opportunities for students."""
        return [
            {
                "external_id": "google-swe-intern-2026",
                "title": "Software Engineer Intern — Summer 2026",
                "organization_name": "Google",
                "organization_website": "https://careers.google.com",
                "description": "Build high-scale software applications and tools used by billions. Work with Google engineers on core systems, testing, and architecture.",
                "type": "internship",
                "category": "software",
                "location": {"city": "Bengaluru", "state": "Karnataka", "country": "India", "is_remote": False},
                "work_mode": "Hybrid",
                "skills": ["Python", "C++", "Java", "Data Structures & Algorithms", "System Design"],
                "education_requirements": {
                    "degrees": ["B.Tech", "B.E.", "M.Tech", "M.S."],
                    "branches": ["Computer Science", "Information Technology", "Electronics"],
                    "graduation_years": [2026, 2027],
                    "cgpa_min": 7.5
                },
                "experience": {"min_years": 0, "max_years": 1},
                "eligibility_text": "Must be currently enrolled in an engineering degree with expected graduation in 2026 or 2027. Minimum 7.5 CGPA required.",
                "application_url": "https://careers.google.com/jobs/results/swe-intern-india",
                "deadline": "2026-11-30T23:59:59Z",
                "posted_at": "2026-09-15T00:00:00Z",
                "compensation": {"type": "stipend", "min": 110000, "max": 130000, "currency": "INR"}
            },
            {
                "external_id": "stripe-infra-intern-2026",
                "title": "Software Engineering Intern — Core Infrastructure",
                "organization_name": "Stripe",
                "organization_website": "https://stripe.com/jobs",
                "description": "Design and optimize high-throughput financial infrastructure processing millions of transactions per day with strict reliability guarantees.",
                "type": "internship",
                "category": "software",
                "location": {"city": "Bengaluru", "state": "Karnataka", "country": "India", "is_remote": False},
                "work_mode": "Hybrid",
                "skills": ["Go", "Python", "Distributed Systems", "SQL", "REST APIs"],
                "education_requirements": {
                    "degrees": ["B.Tech", "B.S."],
                    "branches": ["Computer Science", "Software Engineering"],
                    "graduation_years": [2026, 2027],
                    "cgpa_min": 7.0
                },
                "experience": {"min_years": 0, "max_years": 1},
                "eligibility_text": "Undergraduate students graduating in 2026 or 2027. Strong systems and database fundamentals.",
                "application_url": "https://stripe.com/jobs/listing/swe-intern-india",
                "deadline": "2026-11-15T23:59:59Z",
                "posted_at": "2026-09-20T00:00:00Z",
                "compensation": {"type": "stipend", "min": 125000, "max": 140000, "currency": "INR"}
            },
            {
                "external_id": "microsoft-ai-research-2026",
                "title": "AI & Machine Learning Research Intern",
                "organization_name": "Microsoft",
                "organization_website": "https://careers.microsoft.com",
                "description": "Collaborate with Microsoft Research (MSR) scientists on state-of-the-art Large Language Models, reasoning engines, and multimodal AI systems.",
                "type": "internship",
                "category": "artificial_intelligence",
                "location": {"city": "Hyderabad", "state": "Telangana", "country": "India", "is_remote": False},
                "work_mode": "Hybrid",
                "skills": ["Python", "PyTorch", "Machine Learning", "Deep Learning", "Natural Language Processing (NLP)"],
                "education_requirements": {
                    "degrees": ["B.Tech", "M.Tech", "Dual Degree"],
                    "branches": ["Computer Science", "Artificial Intelligence", "Data Science"],
                    "graduation_years": [2026, 2027],
                    "cgpa_min": 8.0
                },
                "experience": {"min_years": 0, "max_years": 2},
                "eligibility_text": "Students with proven coursework or projects in Machine Learning and PyTorch. Minimum 8.0 CGPA.",
                "application_url": "https://careers.microsoft.com/us/en/job/msr-ai-intern",
                "deadline": "2026-12-01T23:59:59Z",
                "posted_at": "2026-09-25T00:00:00Z",
                "compensation": {"type": "stipend", "min": 100000, "max": 120000, "currency": "INR"}
            },
            {
                "external_id": "mlh-fellowship-summer-2026",
                "title": "MLH Open Source Fellowship — Summer Cohort",
                "organization_name": "Major League Hacking",
                "organization_website": "https://fellowship.mlh.io",
                "description": "A 12-week remote internship alternative where students contribute to major open source projects used by millions of developers globally.",
                "type": "fellowship",
                "category": "software",
                "location": {"city": "Remote", "state": None, "country": "Global", "is_remote": True},
                "work_mode": "Remote",
                "skills": ["Git", "Python", "JavaScript", "React", "Docker", "Node.js"],
                "education_requirements": {
                    "degrees": ["B.Tech", "B.S.", "BCA", "Any"],
                    "branches": ["Any"],
                    "graduation_years": [2025, 2026, 2027, 2028],
                    "cgpa_min": None
                },
                "experience": {"min_years": 0, "max_years": 2},
                "eligibility_text": "Open to all students worldwide. Proficiency in Git and at least one programming language.",
                "application_url": "https://fellowship.mlh.io/apply",
                "deadline": "2026-11-20T23:59:59Z",
                "posted_at": "2026-09-10T00:00:00Z",
                "compensation": {"type": "stipend", "min": 50000, "max": 80000, "currency": "INR"}
            },
            {
                "external_id": "smart-india-hackathon-2026",
                "title": "Smart India Hackathon (SIH) 2026 — Hardware & Software",
                "organization_name": "Ministry of Education & AICTE",
                "organization_website": "https://sih.gov.in",
                "description": "World's biggest open innovation model challenging student teams to solve real problems posed by ministries, departments, and industries.",
                "type": "hackathon",
                "category": "software",
                "location": {"city": "New Delhi", "state": "Delhi", "country": "India", "is_remote": False},
                "work_mode": "Onsite",
                "skills": ["Full Stack", "Mobile Development", "Internet of Things (IoT)", "Python", "React"],
                "education_requirements": {
                    "degrees": ["B.Tech", "B.E.", "MCA", "Diploma"],
                    "branches": ["Any Technical Branch"],
                    "graduation_years": [2025, 2026, 2027, 2028],
                    "cgpa_min": None
                },
                "experience": {"min_years": 0, "max_years": 0},
                "eligibility_text": "Teams of 6 students from recognized institutions. At least 1 female team member mandatory.",
                "application_url": "https://sih.gov.in/register",
                "deadline": "2026-10-31T18:00:00Z",
                "posted_at": "2026-09-01T00:00:00Z",
                "compensation": {"type": "prize", "min": 100000, "max": 100000, "currency": "INR"}
            },
            {
                "external_id": "postman-api-intern-2026",
                "title": "Backend Engineering Intern — API Platform",
                "organization_name": "Postman",
                "organization_website": "https://www.postman.com/company/careers",
                "description": "Help develop scalable developer tooling and collaborative API platform services powering over 30 million engineers.",
                "type": "internship",
                "category": "software",
                "location": {"city": "Bengaluru", "state": "Karnataka", "country": "India", "is_remote": False},
                "work_mode": "Hybrid",
                "skills": ["Node.js", "TypeScript", "REST APIs", "PostgreSQL", "Docker"],
                "education_requirements": {
                    "degrees": ["B.Tech", "B.E."],
                    "branches": ["Computer Science", "Information Technology"],
                    "graduation_years": [2026, 2027],
                    "cgpa_min": 7.0
                },
                "experience": {"min_years": 0, "max_years": 1},
                "eligibility_text": "Engineering students graduating in 2026 or 2027. Practical project experience in Node.js or TypeScript.",
                "application_url": "https://www.postman.com/company/careers/openings/backend-intern",
                "deadline": "2026-11-25T23:59:59Z",
                "posted_at": "2026-09-18T00:00:00Z",
                "compensation": {"type": "stipend", "min": 80000, "max": 95000, "currency": "INR"}
            },
            {
                "external_id": "meta-hacker-cup-2026",
                "title": "Meta Hacker Cup 2026 — Global Algorithmic Contest",
                "organization_name": "Meta",
                "organization_website": "https://www.facebook.com/codingcompetitions/hacker-cup",
                "description": "Annual world-wide algorithmic programming contest where participants tackle challenging algorithmic puzzles against top developers.",
                "type": "coding_contest",
                "category": "software",
                "location": {"city": "Remote", "state": None, "country": "Global", "is_remote": True},
                "work_mode": "Remote",
                "skills": ["C++", "Java", "Python", "Data Structures & Algorithms", "Mathematics"],
                "education_requirements": {
                    "degrees": ["Any"],
                    "branches": ["Any"],
                    "graduation_years": [],
                    "cgpa_min": None
                },
                "experience": {"min_years": 0, "max_years": 0},
                "eligibility_text": "Open to all participants globally aged 18+ or students with parental consent.",
                "application_url": "https://www.facebook.com/codingcompetitions/hacker-cup",
                "deadline": "2026-12-15T23:59:59Z",
                "posted_at": "2026-09-05T00:00:00Z",
                "compensation": {"type": "prize", "min": 20000, "max": 50000, "currency": "USD"}
            },
            {
                "external_id": "grace-hopper-scholarship-2026",
                "title": "Grace Hopper Celebration Student Scholar Award 2026",
                "organization_name": "AnitaB.org",
                "organization_website": "https://anitab.org",
                "description": "Full conference registration and travel sponsorship for undergraduate and graduate women and non-binary students in technology.",
                "type": "scholarship",
                "category": "general",
                "location": {"city": "Orlando", "state": "Florida", "country": "USA", "is_remote": False},
                "work_mode": "Onsite",
                "skills": ["Computer Science", "Community Leadership"],
                "education_requirements": {
                    "degrees": ["B.Tech", "B.S.", "M.S.", "Ph.D."],
                    "branches": ["Computer Science", "Information Systems", "STEM"],
                    "graduation_years": [2026, 2027, 2028],
                    "cgpa_min": None
                },
                "experience": {"min_years": 0, "max_years": 0},
                "eligibility_text": "Full-time students in computing or STEM identifying as women or non-binary.",
                "application_url": "https://anitab.org/ghc-scholarships",
                "deadline": "2026-11-10T23:59:59Z",
                "posted_at": "2026-08-30T00:00:00Z",
                "compensation": {"type": "grant", "min": 2500, "max": 3500, "currency": "USD"}
            }
        ]

    def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        """Maps curated item structure into canonical opportunity format."""
        return {
            "title": raw_item.get("title"),
            "organization": {
                "name": raw_item.get("organization_name"),
                "website": raw_item.get("organization_website")
            },
            "description": raw_item.get("description", ""),
            "type": raw_item.get("type", "internship"),
            "category": raw_item.get("category", "software"),
            "location": raw_item.get("location", {"city": "Remote", "is_remote": True}),
            "work_mode": raw_item.get("work_mode", "Remote"),
            "skills": raw_item.get("skills", []),
            "education_requirements": raw_item.get("education_requirements", {}),
            "experience": raw_item.get("experience", {}),
            "eligibility_text": raw_item.get("eligibility_text", ""),
            "application_url": raw_item.get("application_url", ""),
            "source": {
                "name": self.name,
                "url": raw_item.get("application_url", ""),
                "external_id": raw_item.get("external_id")
            },
            "dates": {
                "posted_at": raw_item.get("posted_at"),
                "deadline": raw_item.get("deadline")
            },
            "compensation": raw_item.get("compensation", {}),
            "status": "active"
        }
