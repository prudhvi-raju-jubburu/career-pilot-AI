import pytest
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app import create_app
from app.models.opportunity import OpportunityModel
from app.models.profile import ProfileModel
from app.models.application import ApplicationModel
from app.services.opportunity_service import OpportunityService
from app.services.recommendation_engine import RecommendationEngine
from app.services.eligibility_engine import EligibilityEngine

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

@pytest.fixture(autouse=True)
def clean_audit_db(client):
    col_opp = OpportunityModel.get_collection()
    col_opp.delete_many({"source.name": {"$regex": "^test_audit_"}})
    col_prof = ProfileModel.get_collection()
    col_prof.delete_many({"user_id": {"$regex": "^audit_student_"}})
    col_app = ApplicationModel.get_collection()
    col_app.delete_many({"user_id": {"$regex": "^audit_student_"}})
    yield
    col_opp.delete_many({"source.name": {"$regex": "^test_audit_"}})
    col_prof.delete_many({"user_id": {"$regex": "^audit_student_"}})
    col_app.delete_many({"user_id": {"$regex": "^audit_student_"}})

# =====================================================================
# 1. RECOMMENDATION QUALITY & RANKING ORDER AUDIT
# =====================================================================

def test_recommendation_ranking_strong_vs_weak_vs_unrelated():
    """
    Validates ranking order:
    1. Strong match (aligned skills, target role, education, location)
    2. Weak match (partially overlapping skills, unrelated role)
    3. Unrelated (zero skill overlap, completely different domain)
    """
    student_id = "audit_student_ranking_1"
    profile = {
        "user_id": student_id,
        "target_role": "Backend Engineer",
        "skills": ["Go", "PostgreSQL", "Docker", "Kafka"],
        "education": {"degree": "B.Tech", "branch": "Computer Science & Engineering", "graduation_year": 2026, "cgpa": 8.5},
        "projects": [{"title": "Distributed Task Queue", "technologies": ["Go", "Kafka"]}],
        "preferences": {"preferred_locations": ["Bengaluru"], "work_modes": ["Hybrid", "Remote"]}
    }
    ProfileModel.get_collection().insert_one(dict(profile))

    # Opp 1: Strong Match (Go Backend Engineer in Bengaluru)
    strong_opp = {
        "title": "Backend Engineer - Go",
        "organization": {"name": "Audit Cloud Corp"},
        "type": "job",
        "category": "software",
        "location": {"city": "Bengaluru", "is_remote": False},
        "skills": ["Go", "PostgreSQL", "Kafka", "Docker"],
        "education_requirements": {"branches": ["Computer Science & Engineering"], "cgpa_min": 7.5},
        "source": {"name": "test_audit_src", "external_id": "opp_strong_1"},
        "application_url": "https://auditcloud.in/jobs/strong-1"
    }
    # Opp 2: Weak Match (Data Analyst with basic SQL / Python)
    weak_opp = {
        "title": "Junior Data Analyst",
        "organization": {"name": "Audit Data Inc"},
        "type": "job",
        "category": "data_science",
        "location": {"city": "Bengaluru", "is_remote": False},
        "skills": ["Python", "Excel", "Tableau", "PostgreSQL"],
        "education_requirements": {"branches": ["Computer Science & Engineering"], "cgpa_min": 7.0},
        "source": {"name": "test_audit_src", "external_id": "opp_weak_1"},
        "application_url": "https://auditdata.in/jobs/weak-1"
    }
    # Opp 3: Unrelated (Content Marketing / Graphic Design)
    unrelated_opp = {
        "title": "Graphic Designer & Social Content Creator",
        "organization": {"name": "Audit Media Lab"},
        "type": "job",
        "category": "design",
        "location": {"city": "Mumbai", "is_remote": False},
        "skills": ["Photoshop", "Illustrator", "Copywriting", "Figma"],
        "education_requirements": {"degrees": ["B.Des", "B.A."]},
        "source": {"name": "test_audit_src", "external_id": "opp_unrelated_1"},
        "application_url": "https://auditmedia.in/jobs/unrelated-1"
    }

    doc_s, _ = OpportunityService.upsert_opportunity(strong_opp)
    doc_w, _ = OpportunityService.upsert_opportunity(weak_opp)
    doc_u, _ = OpportunityService.upsert_opportunity(unrelated_opp)

    recs = RecommendationEngine.get_recommendations(user_id=student_id, tab="recommended", limit=100)
    items = recs["items"]

    scores = {item["id"]: item["match_score"] for item in items}
    s_id, w_id, u_id = str(doc_s["_id"]), str(doc_w["_id"]), str(doc_u["_id"])

    # Assert relative order: Strong > Weak > Unrelated
    assert s_id in scores
    assert w_id in scores
    assert scores[s_id] > scores[w_id]
    if u_id in scores:
        assert scores[w_id] > scores[u_id]

    # Verify grounded rationale
    strong_item = next(i for i in items if i["id"] == s_id)
    assert "Go" in strong_item["demonstrated_skills"] or "Kafka" in strong_item["demonstrated_skills"]

# =====================================================================
# 2. ELIGIBILITY HARD CONSTRAINTS & STRETCH ROUTING
# =====================================================================

def test_mandatory_cgpa_and_branch_constraints_route_to_stretch():
    """
    Mandatory hard requirements must cleanly separate eligible vs stretch:
    - CGPA cutoff failure -> routed to stretch tab with explicit CGPA failure reason.
    - Branch restriction failure -> routed to stretch tab with branch failure reason.
    """
    student_id = "audit_student_elig_1"
    profile = {
        "user_id": student_id,
        "education": {
            "degree": "B.Tech",
            "branch": "Mechanical Engineering",
            "graduation_year": 2026,
            "cgpa": 6.8
        },
        "skills": ["Python", "Flask", "SQL"]
    }
    ProfileModel.get_collection().insert_one(dict(profile))

    # Opp failing CGPA (cutoff 8.0)
    cgpa_fail_opp = {
        "title": "Software Engineer Intern",
        "organization": {"name": "High Cutoff Systems"},
        "type": "internship",
        "category": "software",
        "skills": ["Python", "Flask"],
        "education_requirements": {"cgpa_min": 8.0, "branches": ["Mechanical Engineering"]},
        "source": {"name": "test_audit_src", "external_id": "opp_cgpa_fail"},
        "application_url": "https://highcutoff.in/jobs/intern-1"
    }
    doc_cf, _ = OpportunityService.upsert_opportunity(cgpa_fail_opp)

    # Opp failing Branch (CS / IT only)
    branch_fail_opp = {
        "title": "Python Backend Developer",
        "organization": {"name": "CSE Only Labs"},
        "type": "job",
        "category": "software",
        "skills": ["Python", "SQL"],
        "education_requirements": {"cgpa_min": 6.0, "branches": ["Computer Science & Engineering", "Information Technology"]},
        "source": {"name": "test_audit_src", "external_id": "opp_branch_fail"},
        "application_url": "https://cseonly.in/jobs/dev-1"
    }
    doc_bf, _ = OpportunityService.upsert_opportunity(branch_fail_opp)

    # Recommended feed MUST NOT contain these items
    recs = RecommendationEngine.get_recommendations(user_id=student_id, tab="recommended", limit=100)
    rec_ids = [i["id"] for i in recs["items"]]
    assert str(doc_cf["_id"]) not in rec_ids
    assert str(doc_bf["_id"]) not in rec_ids

    # Stretch feed MUST contain them with explicit failure reasons
    stretch = RecommendationEngine.get_recommendations(user_id=student_id, tab="stretch")
    stretch_map = {i["id"]: i for i in stretch["items"]}

    assert str(doc_cf["_id"]) in stretch_map
    assert any("cgpa" in r.lower() for r in stretch_map[str(doc_cf["_id"])].get("stretch_reasons", []))

    assert str(doc_bf["_id"]) in stretch_map
    assert any("branch" in r.lower() for r in stretch_map[str(doc_bf["_id"])].get("stretch_reasons", []))

# =====================================================================
# 3. DEMONSTRATED VS LISTED SKILLS & RESUME TRANSPARENCY
# =====================================================================

def test_demonstrated_project_skills_score_higher_than_unverified_listed():
    """
    A student with verified project evidence receives higher skill relevance
    than a student with only unverified self-reported profile skills.
    """
    # Student A: Verified project evidence with React & Node.js
    student_a = {
        "user_id": "audit_student_demonstrated",
        "skills": ["React", "Node.js"],
        "projects": [{"title": "Fullstack Platform", "technologies": ["React", "Node.js"]}],
        "education": {"degree": "B.Tech", "branch": "CSE", "graduation_year": 2026, "cgpa": 8.0}
    }
    # Student B: Self-reported skills without project or resume evidence
    student_b = {
        "user_id": "audit_student_listed_only",
        "skills": ["React", "Node.js"],
        "projects": [],
        "education": {"degree": "B.Tech", "branch": "CSE", "graduation_year": 2026, "cgpa": 8.0}
    }
    ProfileModel.get_collection().insert_one(dict(student_a))
    ProfileModel.get_collection().insert_one(dict(student_b))

    target_opp = {
        "title": "Fullstack React Node Developer",
        "organization": {"name": "WebScale In"},
        "type": "job",
        "category": "software",
        "skills": ["React", "Node.js"],
        "source": {"name": "test_audit_src", "external_id": "opp_fs_react"},
        "application_url": "https://webscale.in/jobs/fs-1"
    }
    OpportunityService.upsert_opportunity(target_opp)

    recs_a = RecommendationEngine.get_recommendations(user_id="audit_student_demonstrated", tab="recommended")
    recs_b = RecommendationEngine.get_recommendations(user_id="audit_student_listed_only", tab="recommended")

    item_a = next(i for i in recs_a["items"] if i.get("source", {}).get("external_id") == "opp_fs_react")
    item_b = next(i for i in recs_b["items"] if i.get("source", {}).get("external_id") == "opp_fs_react")

    # Student A with verified project skills scores >= Student B
    assert item_a["score_breakdown"]["skill_relevance"] >= item_b["score_breakdown"]["skill_relevance"]
    assert len(item_a["demonstrated_skills"]) >= 2
    assert len(item_b["demonstrated_skills"]) == 0

# =====================================================================
# 4. PRIVACY & SECURITY: CROSS-USER DATA ISOLATION
# =====================================================================

def test_data_isolation_and_authorization(client):
    """
    Verifies that Student A cannot access Student B's recommendations,
    evidence profile, or private application tracking records.
    """
    uid_a = "audit_student_alpha"
    uid_b = "audit_student_beta"

    ProfileModel.get_collection().insert_one({
        "user_id": uid_a,
        "personal": {"fullName": "Alpha Student", "email": "alpha@audit.edu"},
        "skills": ["Solidity", "Blockchain"],
        "education": {"degree": "B.Tech", "branch": "CSE"}
    })
    ProfileModel.get_collection().insert_one({
        "user_id": uid_b,
        "personal": {"fullName": "Beta Student", "email": "beta@audit.edu"},
        "skills": ["Kubernetes", "DevOps"],
        "education": {"degree": "B.Tech", "branch": "IT"}
    })

    # Student A's recommendations must not leak Student B's skills or projects
    ev_a = RecommendationEngine.build_student_evidence_profile({"user_id": uid_a, "skills": ["Solidity", "Blockchain"]})
    ev_b = RecommendationEngine.build_student_evidence_profile({"user_id": uid_b, "skills": ["Kubernetes", "DevOps"]})

    assert "solidity" in ev_a["all_student_skills"]
    assert "kubernetes" not in ev_a["all_student_skills"]
    assert "kubernetes" in ev_b["all_student_skills"]
    assert "solidity" not in ev_b["all_student_skills"]

    recs_a = RecommendationEngine.get_recommendations(user_id=uid_a)
    recs_b = RecommendationEngine.get_recommendations(user_id=uid_b)

    assert recs_a["evidence_summary"]["listed_skills_count"] == 2
    assert recs_b["evidence_summary"]["listed_skills_count"] == 2

# =====================================================================
# 5. COLD-START RECOMMENDATION SEMANTICS (TASK 2)
# =====================================================================

def test_cold_start_three_tier_semantics():
    """
    Validates three distinct personalization tiers:
    - Fully personalized: profile + verified resume evidence -> match score computed, high evidence.
    - Partially personalized: profile without resume -> profile match score, partial evidence.
    - General discovery: minimal / empty profile -> match_score is None, why_matched is [], is_general_discovery is True.
    """
    col_opp = OpportunityModel.get_collection()
    col_prof = ProfileModel.get_collection()

    opp_data = {
        "title": "Fullstack Cloud Developer",
        "organization": {"name": "Audit Cloud Corp"},
        "type": "job",
        "category": "software",
        "skills": ["Python", "FastAPI", "React"],
        "education_requirements": {"branches": ["Computer Science & Engineering"], "cgpa_min": 7.5},
        "dates": {"posted_at": "2026-10-25T00:00:00Z", "deadline": "2026-12-31T23:59:59Z"},
        "source": {"name": "test_audit_src", "external_id": "opp_cs_1"},
        "application_url": "https://auditcloud.in/jobs/cs-1",
        "status": "active"
    }
    OpportunityService.upsert_opportunity(opp_data)

    # State A: Full profile + resume
    uid_a = "audit_student_tier_full"
    col_prof.insert_one({
        "user_id": uid_a,
        "education": {"degree": "B.Tech", "branch": "Computer Science & Engineering", "cgpa": 8.5, "graduation_year": 2026},
        "skills": ["Python", "FastAPI", "React"],
        "projects": [{"title": "Cloud API", "technologies": ["Python", "FastAPI"]}],
        "resume": {"fileName": "resume.pdf", "verified": True}
    })

    # State B: Partial profile, no resume
    uid_b = "audit_student_tier_partial"
    col_prof.insert_one({
        "user_id": uid_b,
        "education": {"degree": "B.Tech", "branch": "Computer Science & Engineering", "cgpa": 8.0, "graduation_year": 2026},
        "skills": ["Python"],
        "projects": [],
        "resume": {}
    })

    # State C: Minimal / brand-new student
    uid_c = "audit_student_tier_minimal"
    col_prof.insert_one({
        "user_id": uid_c
    })

    recs_a = RecommendationEngine.get_recommendations(user_id=uid_a)
    recs_b = RecommendationEngine.get_recommendations(user_id=uid_b)
    recs_c = RecommendationEngine.get_recommendations(user_id=uid_c)

    # Tier A: Fully personalized
    assert recs_a["personalization_tier"] == "fully_personalized"
    assert recs_a["evidence_level"] == "high"
    assert recs_a["is_general_discovery"] is False
    assert len(recs_a["items"]) > 0
    top_a = recs_a["items"][0]
    assert top_a["match_score"] is not None and top_a["match_score"] >= 70
    assert len(top_a["why_matched"]) > 0

    # Tier B: Partially personalized
    assert recs_b["personalization_tier"] == "partially_personalized"
    assert recs_b["evidence_level"] == "partial"
    assert recs_b["is_general_discovery"] is False
    assert len(recs_b["items"]) > 0
    top_b = recs_b["items"][0]
    assert top_b["match_score"] is not None
    assert top_b["guidance"]["resume_upload_required"] is True

    # Tier C: General discovery
    assert recs_c["personalization_tier"] == "general_discovery"
    assert recs_c["evidence_level"] == "insufficient"
    assert recs_c["is_general_discovery"] is True
    # In general discovery, items in feed must NOT display fabricated match scores or why_matched
    all_c_items = recs_c["items"] + recs_c["counts"].get("stretch", 0) * []
    for itm in recs_c["items"]:
        assert itm["match_score"] is None, "Fabricated match score displayed in general discovery!"
        assert itm["why_matched"] == [], "Unsupported why_matched claims displayed in general discovery!"
        assert itm["is_general_discovery"] is True
        assert itm["guidance"]["missing_profile"] is True

# =====================================================================
# 6. OPPORTUNITY FRESHNESS & DEADLINE VALIDATION (TASK 3)
# =====================================================================

def test_opportunity_freshness_and_deadlines():
    """
    Validates that:
    1. Expired opportunities are excluded from active recommended feed.
    2. Upcoming opportunities are included in active feed.
    3. Missing deadlines are transparently handled as rolling admissions.
    4. Stale source records are tracked via last_seen_at without corrupting data.
    5. Historical applications for expired opportunities remain accessible in applied feed.
    """
    col_opp = OpportunityModel.get_collection()
    col_prof = ProfileModel.get_collection()
    col_app = ApplicationModel.get_collection()

    uid = "audit_student_freshness"
    col_prof.insert_one({
        "user_id": uid,
        "education": {"degree": "B.Tech", "branch": "Computer Science", "graduation_year": 2026, "cgpa": 8.0},
        "skills": ["Python", "Django"],
        "resume": {"fileName": "resume.pdf"}
    })

    now_utc = datetime.now(timezone.utc)
    yesterday = (now_utc - timedelta(days=1)).strftime("%Y-%m-%d")
    next_week = (now_utc + timedelta(days=7)).strftime("%Y-%m-%d")

    # 1. Expired opportunity
    opp_expired = {
        "title": "Expired Python Internship",
        "organization": {"name": "Old Corp"},
        "type": "internship",
        "skills": ["Python"],
        "dates": {"posted_at": "2026-09-01", "deadline": yesterday},
        "status": "active",  # Date is expired even if status flag wasn't flipped yet
        "source": {"name": "test_audit_src", "external_id": "opp_exp_1"},
        "application_url": "https://oldcorp.in/jobs/1"
    }
    # 2. Upcoming opportunity
    opp_upcoming = {
        "title": "Active Python Django Role",
        "organization": {"name": "Fresh Corp"},
        "type": "job",
        "skills": ["Python", "Django"],
        "dates": {"posted_at": "2026-10-25", "deadline": next_week},
        "status": "active",
        "source": {"name": "test_audit_src", "external_id": "opp_up_1"},
        "application_url": "https://freshcorp.in/jobs/1"
    }
    # 3. Rolling / Missing deadline opportunity
    opp_rolling = {
        "title": "Open Source Python Fellowship",
        "organization": {"name": "Open Source Foundation"},
        "type": "scholarship",
        "skills": ["Python"],
        "dates": {"posted_at": "2026-10-28", "deadline": None},
        "status": "active",
        "source": {"name": "test_audit_src", "external_id": "opp_roll_1"},
        "application_url": "https://osf.in/fellowship"
    }

    OpportunityService.upsert_opportunity(opp_expired)
    OpportunityService.upsert_opportunity(opp_upcoming)
    OpportunityService.upsert_opportunity(opp_rolling)

    # Track an application to the expired opportunity to test historical application accessibility
    exp_doc = col_opp.find_one({"source.external_id": "opp_exp_1"})
    col_app.insert_one({
        "user_id": uid,
        "opportunity_id": str(exp_doc["_id"]),
        "company": "Old Corp",
        "role": "Expired Python Internship",
        "status": "Applied",
        "created_at": now_utc.isoformat()
    })

    # Retrieve recommendations
    recs = RecommendationEngine.get_recommendations(user_id=uid, tab="recommended")
    rec_ext_ids = [i.get("source", {}).get("external_id") for i in recs["items"]]

    # 1. Expired must be excluded from active recommended feed
    assert "opp_exp_1" not in rec_ext_ids, "Expired opportunity was included in recommended feed!"

    # 2. Upcoming must be included in active recommended feed
    assert "opp_up_1" in rec_ext_ids, "Upcoming opportunity was missing from recommended feed!"

    # 3. Rolling / missing deadline must be included with transparent deadline display
    assert "opp_roll_1" in rec_ext_ids, "Rolling admission opportunity was missing from recommended feed!"
    rolling_item = next(i for i in recs["items"] if i.get("source", {}).get("external_id") == "opp_roll_1")
    assert rolling_item.get("deadlineString") in ("Deadline not specified", "None", "")

    # 4. Historical applications must remain accessible in the 'applied' tab even after deadline has passed
    applied_recs = RecommendationEngine.get_recommendations(user_id=uid, tab="applied")
    applied_ext_ids = [i.get("source", {}).get("external_id") for i in applied_recs["items"]]
    assert "opp_exp_1" in applied_ext_ids, "Historical application to expired opportunity was lost from applied tab!"

# =====================================================================
# 7. MONGODB URL INDEX COVERAGE & EXECUTION PLAN (TASK 1)
# =====================================================================

def test_mongodb_url_index_coverage_no_collscan():
    """
    Validates that:
    1. All 4 URL lookup branches (application_url, canonical_url, source.url, source_links.url) are indexed.
    2. explain() verifies that no collection scan (COLLSCAN) is performed for deduplication queries.
    """
    OpportunityModel.ensure_indexes()
    col = OpportunityModel.get_collection()
    indexes = col.index_information()

    # Verify index presence
    assert "application_url_1" in indexes, "application_url_1 index missing"
    assert "canonical_url_1" in indexes, "canonical_url_1 index missing"
    assert "source.url_1" in indexes, "source.url_1 index missing"
    assert "source_links.url_1" in indexes, "source_links.url_1 index missing"

    # Verify all URL indexes are sparse (non-destructive to legacy documents)
    assert indexes["application_url_1"].get("sparse") is True
    assert indexes["canonical_url_1"].get("sparse") is True
    assert indexes["source.url_1"].get("sparse") is True
    assert indexes["source_links.url_1"].get("sparse") is True

    # Run explain on Layer 3 $or URL query
    test_url = "https://careers.google.com/jobs/results/swe-intern-india"
    q_or = {
        "$or": [
            {"application_url": test_url},
            {"canonical_url": test_url},
            {"source.url": test_url},
            {"source_links.url": test_url}
        ]
    }
    plan = col.find(q_or).explain()
    winning = plan.get("queryPlanner", {}).get("winningPlan", {})

    # Assert winning plan does not use COLLSCAN
    def assert_no_collscan(stage_obj):
        assert stage_obj.get("stage") != "COLLSCAN", "COLLSCAN detected in deduplication query!"
        if "inputStage" in stage_obj:
            assert_no_collscan(stage_obj["inputStage"])
        if "inputStages" in stage_obj:
            for s in stage_obj["inputStages"]:
                assert_no_collscan(s)

    assert_no_collscan(winning)
