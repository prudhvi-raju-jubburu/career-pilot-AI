import pytest
from datetime import datetime, timedelta, timezone
from app import create_app
from app.models.opportunity import OpportunityModel
from app.models.profile import ProfileModel
from app.models.application import ApplicationModel
from app.models.user import UserModel
from app.services.dedup_service import DeduplicationService
from app.services.opportunity_service import OpportunityService
from app.services.ingestion_service import OpportunityIngestionService
from app.services.recommendation_engine import RecommendationEngine
from app.services.eligibility_engine import EligibilityEngine
from app.utils.opportunity_normalizer import canonicalize_url, generate_dedupe_key

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.app_context():
        with app.test_client() as client:
            yield client

@pytest.fixture(autouse=True)
def clean_db(client):
    col_opp = OpportunityModel.get_collection()
    col_opp.delete_many({"source.name": {"$regex": "^test_"}})
    col_user = UserModel.get_collection()
    col_user.delete_many({"$or": [{"email": {"$regex": "^test_dedup_"}}, {"user_id": {"$regex": "^(test_|student_)"}}]})
    col_prof = ProfileModel.get_collection()
    col_prof.delete_many({"$or": [{"personal.email": {"$regex": "^test_dedup_"}}, {"user_id": {"$regex": "^(test_|student_)"}}]})
    col_app = ApplicationModel.get_collection()
    col_app.delete_many({"user_id": {"$regex": "^(test_|student_)"}})
    yield
    col_opp.delete_many({"source.name": {"$regex": "^test_"}})
    col_user.delete_many({"$or": [{"email": {"$regex": "^test_dedup_"}}, {"user_id": {"$regex": "^(test_|student_)"}}]})
    col_prof.delete_many({"$or": [{"personal.email": {"$regex": "^test_dedup_"}}, {"user_id": {"$regex": "^(test_|student_)"}}]})
    col_app.delete_many({"user_id": {"$regex": "^(test_|student_)"}})

# =========================================================================
# 1. URL CANONICALIZATION & PARAM STRIPPING TESTS
# =========================================================================

def test_canonicalize_url_strips_tracking_params():
    url_with_tracking = "https://www.example.com/jobs/123/?utm_source=linkedin&utm_medium=cpc&utm_campaign=hiring&ref=job_board&fbclid=abc123xyz#apply"
    canonical = canonicalize_url(url_with_tracking)
    assert "utm_source" not in canonical
    assert "utm_medium" not in canonical
    assert "fbclid" not in canonical
    assert "ref" not in canonical
    assert "#apply" not in canonical
    assert canonical == "https://example.com/jobs/123"

def test_canonicalize_url_preserves_meaningful_params():
    url_with_job_id = "https://boards.greenhouse.io/embed/job_app?for=phonepe&token=123456"
    canonical = canonicalize_url(url_with_job_id)
    assert "for=phonepe" in canonical
    assert "token=123456" in canonical

# =========================================================================
# 2. DEDUPLICATION SERVICE LAYERED MATCHING & MERGING TESTS
# =========================================================================

def test_same_external_id_from_repeated_syncs_updates_record():
    opp_data = {
        "title": "Software Engineer Intern",
        "organization": {"name": "Test Unicorn", "website": "https://testunicorn.in"},
        "description": "Initial brief description",
        "type": "internship",
        "category": "software",
        "location": {"city": "Bengaluru", "country": "India", "is_remote": False},
        "work_mode": "Onsite",
        "skills": ["Python", "Docker"],
        "source": {"name": "test_ats", "external_id": "ext_9999", "url": "https://testunicorn.in/job/9999"},
        "application_url": "https://testunicorn.in/job/9999"
    }

    doc1, created1 = OpportunityService.upsert_opportunity(opp_data)
    assert created1 is True
    original_id = doc1["_id"]
    original_created_at = doc1["created_at"]

    # Re-fetch same opportunity with additional skills and richer description
    updated_opp_data = dict(opp_data)
    updated_opp_data["description"] = "A much richer and more detailed description of the role with FastAPI and SQL requirements."
    updated_opp_data["skills"] = ["Python", "Docker", "FastAPI", "PostgreSQL"]

    doc2, created2 = OpportunityService.upsert_opportunity(updated_opp_data)
    assert created2 is False
    assert doc2["_id"] == original_id
    assert doc2["created_at"] == original_created_at
    # Merged skills union
    assert "FastAPI" in doc2["skills"]
    assert "PostgreSQL" in doc2["skills"]
    assert "Docker" in doc2["skills"]
    assert doc2["last_seen_at"] is not None

def test_same_url_with_tracking_params_is_recognized_as_duplicate():
    base_opp = {
        "title": "Full Stack Developer",
        "organization": {"name": "DevWorks India", "website": "https://devworks.in"},
        "description": "React and Node.js fullstack position in Pune.",
        "type": "job",
        "category": "software",
        "location": {"city": "Pune", "country": "India"},
        "skills": ["React", "Node.js"],
        "source": {"name": "test_board", "url": "https://devworks.in/careers/fs-dev"},
        "application_url": "https://devworks.in/careers/fs-dev"
    }

    doc1, created1 = OpportunityService.upsert_opportunity(base_opp)
    assert created1 is True

    # Same opportunity with UTM tracking tags
    tracking_opp = dict(base_opp)
    tracking_opp["application_url"] = "https://devworks.in/careers/fs-dev/?utm_source=newsletter&utm_medium=email"

    existing_dup, reason = DeduplicationService.find_duplicate(
        OpportunityService.normalize_opportunity(tracking_opp)
    )
    assert existing_dup is not None
    assert reason in ("canonical_url", "raw_hash", "cross_source_exact")
    assert existing_dup["_id"] == doc1["_id"]

def test_distinct_job_titles_at_same_company_are_not_discarded():
    opp_backend = {
        "title": "Software Engineer - Backend",
        "organization": {"name": "Acme Fintech", "website": "https://acmefin.in"},
        "description": "Backend services with Go and PostgreSQL",
        "type": "job",
        "category": "software",
        "location": {"city": "Bengaluru", "country": "India"},
        "skills": ["Go", "PostgreSQL"],
        "source": {"name": "test_board", "external_id": "job_backend_1"},
        "application_url": "https://acmefin.in/jobs/backend-1"
    }

    opp_frontend = {
        "title": "Software Engineer - Frontend",
        "organization": {"name": "Acme Fintech", "website": "https://acmefin.in"},
        "description": "Frontend UI with React and TypeScript",
        "type": "job",
        "category": "software",
        "location": {"city": "Bengaluru", "country": "India"},
        "skills": ["React", "TypeScript"],
        "source": {"name": "test_board", "external_id": "job_frontend_1"},
        "application_url": "https://acmefin.in/jobs/frontend-1"
    }

    doc_b, created_b = OpportunityService.upsert_opportunity(opp_backend)
    doc_f, created_f = OpportunityService.upsert_opportunity(opp_frontend)

    assert created_b is True
    assert created_f is True
    assert doc_b["_id"] != doc_f["_id"]

def test_intern_vs_senior_at_same_company_are_not_merged():
    intern_opp = {
        "title": "Software Engineer Intern",
        "organization": {"name": "CloudScale India"},
        "description": "Internship for university freshers",
        "type": "internship",
        "location": {"city": "Hyderabad", "country": "India"},
        "source": {"name": "test_board", "external_id": "int_1"},
        "application_url": "https://cloudscale.in/careers/intern"
    }
    senior_opp = {
        "title": "Senior Software Engineer",
        "organization": {"name": "CloudScale India"},
        "description": "Lead engineer with 5+ years experience",
        "type": "job",
        "location": {"city": "Hyderabad", "country": "India"},
        "source": {"name": "test_board", "external_id": "sr_1"},
        "application_url": "https://cloudscale.in/careers/senior"
    }

    doc_i, cr_i = OpportunityService.upsert_opportunity(intern_opp)
    doc_s, cr_s = OpportunityService.upsert_opportunity(senior_opp)

    assert cr_i is True
    assert cr_s is True
    assert doc_i["_id"] != doc_s["_id"]

def test_same_title_in_distinct_locations_remain_distinct():
    bangalore_opp = {
        "title": "Associate SDE",
        "organization": {"name": "Metro Mobility"},
        "location": {"city": "Bengaluru", "country": "India", "is_remote": False},
        "source": {"name": "test_board", "external_id": "sde_blr"},
        "application_url": "https://metromobility.in/blr/sde"
    }
    delhi_opp = {
        "title": "Associate SDE",
        "organization": {"name": "Metro Mobility"},
        "location": {"city": "Delhi NCR", "country": "India", "is_remote": False},
        "source": {"name": "test_board", "external_id": "sde_del"},
        "application_url": "https://metromobility.in/del/sde"
    }

    doc1, cr1 = OpportunityService.upsert_opportunity(bangalore_opp)
    doc2, cr2 = OpportunityService.upsert_opportunity(delhi_opp)

    assert cr1 is True
    assert cr2 is True
    assert doc1["_id"] != doc2["_id"]

# =========================================================================
# 3. PERSONALIZATION, EVIDENCE PROFILE & ELIGIBILITY DECOUPLING
# =========================================================================

def test_demonstrated_vs_listed_skills_classification():
    profile = {
        "user_id": "test_student_101",
        "skills": ["Python", "SQL"],  # Listed profile skills
        "projects": [
            {
                "title": "CareerPilot AI",
                "technologies": ["React", "Node.js", "MongoDB"],
                "description": "Built fullstack AI career assistant"
            }
        ],
        "experience": [
            {
                "role": "Backend Intern",
                "company": "TechStart",
                "technologies": ["FastAPI", "Docker"]
            }
        ]
    }

    evidence = RecommendationEngine.build_student_evidence_profile(profile)
    # Verified demonstrated skills from project and internship
    assert "react" in evidence["demonstrated_skills"]
    assert "mongodb" in evidence["demonstrated_skills"]
    assert "fastapi" in evidence["demonstrated_skills"]
    assert "docker" in evidence["demonstrated_skills"]

    # Listed skills from profile
    assert "python" in evidence["listed_skills"]
    assert "sql" in evidence["listed_skills"]

    # Test skill gap breakdown against an opportunity
    opp = {
        "skills": ["React", "FastAPI", "Python", "Kubernetes", "AWS"]
    }
    gap = RecommendationEngine._build_skill_gap(opp, evidence)

    demonstrated_names = [d["skill"] for d in gap["demonstrated"]]
    listed_names = [l["skill"] for l in gap["listed"]]

    assert "React" in demonstrated_names
    assert "FastAPI" in demonstrated_names
    assert "Python" in listed_names
    assert "Kubernetes" in gap["potential_gaps"]
    assert "AWS" in gap["potential_gaps"]

def test_mandatory_eligibility_failure_cannot_be_overridden_by_high_score(client):
    # Student with low CGPA (6.5)
    student_profile = {
        "user_id": "test_cgpa_student",
        "education": {
            "degree": "B.Tech",
            "branch": "Computer Science & Engineering",
            "graduation_year": 2026,
            "cgpa": 6.5
        },
        "skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "AWS", "Redis"],
        "target_role": "Backend Developer"
    }
    ProfileModel.get_collection().insert_one(dict(student_profile))

    # Opportunity with strict CGPA cutoff 8.0, but matching 100% of skills & target role
    opp_data = {
        "title": "Backend Developer",
        "organization": {"name": "Top Tier Labs India"},
        "skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "AWS", "Redis"],
        "type": "job",
        "category": "software",
        "education_requirements": {
            "cgpa_min": 8.0,
            "branches": ["Computer Science & Engineering"]
        },
        "source": {"name": "test_top_tier", "external_id": "job_tier1"},
        "application_url": "https://toptier.in/jobs/backend-1"
    }
    OpportunityService.upsert_opportunity(opp_data)

    # Retrieve recommendations
    recs = RecommendationEngine.get_recommendations(user_id="test_cgpa_student", tab="recommended")

    # MUST NOT appear in active recommended items
    assert "job_tier1" not in [item.get("source", {}).get("external_id") for item in recs["items"]]

    # MUST appear in stretch items with critical CGPA failure reason
    stretch_recs = RecommendationEngine.get_recommendations(user_id="test_cgpa_student", tab="stretch")
    tier1_stretch = next((item for item in stretch_recs["items"] if item.get("source", {}).get("external_id") == "job_tier1"), None)
    assert tier1_stretch is not None
    assert any("cgpa" in reason.lower() for reason in tier1_stretch.get("stretch_reasons", []))

def test_applied_opportunity_excluded_from_primary_recommendations(client):
    user_id = "test_applied_user_123"
    profile = {
        "user_id": user_id,
        "skills": ["Python", "SQL"],
        "education": {"degree": "B.Tech", "branch": "CSE", "graduation_year": 2026, "cgpa": 8.5}
    }
    ProfileModel.get_collection().insert_one(dict(profile))

    opp_data = {
        "title": "Junior Python Developer",
        "organization": {"name": "Applied Test Org"},
        "skills": ["Python", "SQL"],
        "type": "job",
        "source": {"name": "test_app_source", "external_id": "ext_applied_1"},
        "application_url": "https://applied.in/jobs/junior-python-1"
    }
    doc, _ = OpportunityService.upsert_opportunity(opp_data)
    opp_id = str(doc["_id"])

    # Track application for this opportunity
    ApplicationModel.get_collection().insert_one({
        "user_id": user_id,
        "opportunity_id": opp_id,
        "status": "Applied",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Recommended feed must NOT contain this opportunity
    rec = RecommendationEngine.get_recommendations(user_id=user_id, tab="recommended")
    assert not any(item["id"] == opp_id for item in rec["items"])

    # It should be accessible via tab="applied"
    applied_feed = RecommendationEngine.get_recommendations(user_id=user_id, tab="applied")
    assert any(item["id"] == opp_id for item in applied_feed["items"])

def test_data_isolation_between_students(client):
    # Student A
    profile_a = {
        "user_id": "student_alpha",
        "personal": {"fullName": "Alpha Candidate", "email": "alpha@student.edu"},
        "skills": ["Rust", "Systems Programming"],
        "projects": [{"title": "Rust Operating System", "technologies": ["Rust"]}]
    }
    # Student B
    profile_b = {
        "user_id": "student_beta",
        "personal": {"fullName": "Beta Candidate", "email": "beta@student.edu"},
        "skills": ["Flutter", "Mobile App"],
        "projects": [{"title": "Flutter Ecommerce", "technologies": ["Flutter"]}]
    }
    ProfileModel.get_collection().insert_one(dict(profile_a))
    ProfileModel.get_collection().insert_one(dict(profile_b))

    evidence_a = RecommendationEngine.build_student_evidence_profile(profile_a)
    evidence_b = RecommendationEngine.build_student_evidence_profile(profile_b)

    # Student A must not possess Student B's skills and vice versa
    assert "rust" in evidence_a["demonstrated_skills"]
    assert "flutter" not in evidence_a["demonstrated_skills"]

    assert "flutter" in evidence_b["demonstrated_skills"]
    assert "rust" not in evidence_b["demonstrated_skills"]

def test_missing_resume_handled_gracefully():
    # Student with profile only (no uploaded resume)
    profile = {
        "user_id": "no_resume_student",
        "skills": ["Java", "Spring Boot"],
        "education": {"degree": "B.Tech", "branch": "CSE"}
    }
    evidence = RecommendationEngine.build_student_evidence_profile(profile)
    assert evidence["has_resume"] is False
    assert "java" in evidence["listed_skills"]

    opp = {"title": "Java Developer", "organization": {"name": "Bank of Tech"}, "skills": ["Java", "Spring Boot", "Kafka"]}
    gap = RecommendationEngine._build_skill_gap(opp, evidence)
    assert gap["has_resume_evidence"] is False
    assert "Java" in [l["skill"] for l in gap["listed"]]
    assert "Kafka" in gap["potential_gaps"]

def test_feed_deduplication_prevents_duplicate_cards_in_discovery_and_recommendations(client):
    col = OpportunityModel.get_collection()
    uid = "feed_dedup_test"
    
    # Insert two documents directly into collection that have identical role + company + location
    # (simulating existing legacy duplicates or multi-source postings)
    doc1_id = col.insert_one({
        "title": "Machine Learning Engineer",
        "organization": {"name": "NeuroAI Labs", "website": "https://neuroai.in"},
        "type": "job",
        "category": "software",
        "location": {"city": "Bengaluru", "is_remote": False},
        "skills": ["Python", "PyTorch"],
        "status": "active",
        "source": {"name": "test_board_a", "external_id": f"ext_a_{uid}"},
        "application_url": f"https://neuroai.in/careers/ml-1-{uid}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }).inserted_id

    doc2_id = col.insert_one({
        "title": "Machine Learning Engineer",
        "organization": {"name": "NeuroAI Labs", "website": "https://neuroai.in"},
        "type": "job",
        "category": "software",
        "location": {"city": "Bengaluru", "is_remote": False},
        "skills": ["Python", "TensorFlow"],
        "status": "active",
        "source": {"name": "test_board_b", "external_id": f"ext_b_{uid}"},
        "application_url": f"https://neuroai.in/careers/ml-2-{uid}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }).inserted_id

    try:
        # 1. Verify OpportunityService.list_opportunities deduplicates the feed
        res = OpportunityService.list_opportunities(search="Machine Learning Engineer")
        matching_items = [
            item for item in res["items"]
            if item.get("title") == "Machine Learning Engineer" and
               item.get("organization", {}).get("name") == "NeuroAI Labs"
        ]
        # Must only return ONE card in the feed, never duplicate cards
        assert len(matching_items) == 1

        # 2. Verify RecommendationEngine.get_recommendations deduplicates the feed
        # Insert student profile
        prof_col = ProfileModel.get_collection()
        prof_col.insert_one({
            "user_id": f"student_{uid}",
            "skills": ["Python", "PyTorch"],
            "education": {"degree": "B.Tech", "branch": "CSE", "graduation_year": 2026, "cgpa": 8.0}
        })
        recs = RecommendationEngine.get_recommendations(user_id=f"student_{uid}", tab="recommended")
        rec_matching = [
            item for item in recs["items"]
            if item.get("title") == "Machine Learning Engineer" and
               item.get("organization", {}).get("name") == "NeuroAI Labs"
        ]
        assert len(rec_matching) <= 1
    finally:
        col.delete_many({"_id": {"$in": [doc1_id, doc2_id]}})
        ProfileModel.get_collection().delete_many({"user_id": f"student_{uid}"})
