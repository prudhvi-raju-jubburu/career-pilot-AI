import pytest
from datetime import datetime, timedelta, timezone
from app import create_app
from app.models.opportunity import OpportunityModel
from app.models.user import UserModel
from app.services.opportunity_service import OpportunityService
from app.services.ingestion_service import OpportunityIngestionService
from app.scrapers.base import OpportunitySource
from app.utils.opportunity_normalizer import (
    normalize_opportunity_type,
    normalize_category,
    normalize_location,
    parse_iso_deadline,
    extract_skills_from_text,
    generate_dedupe_key
)

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

@pytest.fixture(autouse=True)
def clean_opportunities(client):
    """Ensure clean opportunities collection before/after each test."""
    col = OpportunityModel.get_collection()
    col.delete_many({"source.name": {"$regex": "^test_"}})
    yield
    col.delete_many({"source.name": {"$regex": "^test_"}})

def get_auth_headers(client, email="opp_test_user@university.edu"):
    u_col = UserModel.get_collection()
    u_col.delete_one({"email": email})
    reg_res = client.post("/api/auth/register", json={
        "name": "Opp Tester",
        "email": email,
        "password": "password123"
    })
    token = reg_res.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}

# 1. Opportunity model creation & 2. Validation
def test_opportunity_model_and_validation():
    valid_raw = {
        "title": "Backend Engineering Intern",
        "organization": {"name": "Acme Corp", "website": "https://acme.org"},
        "description": "Looking for Python, SQL, and Docker skills.",
        "type": "internship",
        "category": "software",
        "location": {"city": "Bengaluru", "country": "India", "is_remote": False},
        "work_mode": "Hybrid",
        "skills": ["Python", "SQL"],
        "education_requirements": {"cgpa_min": 7.0, "branches": ["CSE"]},
        "application_url": "https://acme.org/jobs/123",
        "source": {"name": "test_src", "external_id": "job_1"},
        "dates": {"deadline": "2026-12-31T23:59:59Z"}
    }
    normalized = OpportunityService.normalize_opportunity(valid_raw)
    is_valid, err = OpportunityService.validate_opportunity(normalized)
    assert is_valid is True
    assert err is None
    assert normalized["type"] == "internship"
    assert "Python" in normalized["skills"]
    assert "Docker" in normalized["skills"]  # extracted from description
    assert normalized["metadata"]["raw_hash"] is not None

# 3. Invalid opportunity rejected
def test_invalid_opportunity_rejected():
    # Missing title
    opp_no_title = {"organization": {"name": "Test"}, "application_url": "https://test.org/apply"}
    valid, err = OpportunityService.validate_opportunity(opp_no_title)
    assert valid is False
    assert "title" in err.lower()

    # Short org name
    opp_short_org = {"title": "Valid Title", "organization": {"name": "A"}, "application_url": "https://test.org/apply"}
    valid, err = OpportunityService.validate_opportunity(opp_short_org)
    assert valid is False
    assert "organization" in err.lower()

    # Invalid URL scheme
    opp_bad_url = {"title": "Valid Title", "organization": {"name": "Valid Org"}, "application_url": "ftp://bad.com"}
    valid, err = OpportunityService.validate_opportunity(opp_bad_url)
    assert valid is False

    # Out of range CGPA
    opp_bad_cgpa = {
        "title": "Valid Title",
        "organization": {"name": "Valid Org"},
        "application_url": "https://test.org/apply",
        "education_requirements": {"cgpa_min": 15.0}
    }
    valid, err = OpportunityService.validate_opportunity(opp_bad_cgpa)
    assert valid is False

# 4. Skill normalization
def test_skill_normalization_in_opportunity():
    text = "We require ReactJS, Mongo DB, and NodeJS for this full stack role."
    skills = extract_skills_from_text(text, existing_skills=["py", "c++"])
    assert "React" in skills
    assert "MongoDB" in skills
    assert "Node.js" in skills
    assert "Python" in skills
    assert "C++" in skills
    assert "ReactJS" not in skills

# 5. Opportunity type normalization
def test_opportunity_type_normalization():
    assert normalize_opportunity_type("Summer Intern") == "internship"
    assert normalize_opportunity_type("Full-Time Software Engineer") == "job"
    assert normalize_opportunity_type("Hackathon 2026") == "hackathon"
    assert normalize_opportunity_type("Competitive Coding Contest") == "coding_contest"
    assert normalize_opportunity_type("Research Fellowship") == "fellowship"
    assert normalize_opportunity_type("Random Activity") == "other"

# 6. Location normalization
def test_location_normalization():
    loc1 = normalize_location("Bengaluru, Karnataka, India")
    assert loc1["city"] == "Bengaluru"
    assert loc1["country"] == "India"
    assert loc1["is_remote"] is False

    loc2 = normalize_location("Fully Remote")
    assert loc2["is_remote"] is True

    loc3 = normalize_location({"city": "Hyderabad", "country": "India", "is_remote": True})
    assert loc3["city"] == "Hyderabad"
    assert loc3["is_remote"] is True

# 7. Deadline parsing
def test_deadline_parsing():
    dt_iso = parse_iso_deadline("2026-11-20T18:00:00Z")
    assert "2026-11-20" in dt_iso

    dt_str = parse_iso_deadline("2026-12-15")
    assert "2026-12-15" in dt_str

    dt_human = parse_iso_deadline("Oct 25, 2026")
    assert "2026-10-25" in dt_human

    assert parse_iso_deadline(None) is None
    assert parse_iso_deadline("unparseable string") is None

# 8. Expired opportunity handling
def test_expired_opportunity_handling():
    past_date = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
    future_date = (datetime.now(timezone.utc) + timedelta(days=20)).isoformat()

    opp_expired_raw = {
        "title": "Expired Fellowship",
        "organization": {"name": "Past Foundation"},
        "application_url": "https://past.org/apply",
        "type": "fellowship",
        "source": {"name": "test_src", "external_id": "past_1"},
        "dates": {"deadline": past_date}
    }
    norm_expired = OpportunityService.normalize_opportunity(opp_expired_raw)
    assert norm_expired["status"] == "expired"

    opp_active_raw = {
        "title": "Active Fellowship",
        "organization": {"name": "Future Foundation"},
        "application_url": "https://future.org/apply",
        "type": "fellowship",
        "source": {"name": "test_src", "external_id": "future_1"},
        "dates": {"deadline": future_date}
    }
    norm_active = OpportunityService.normalize_opportunity(opp_active_raw)
    assert norm_active["status"] == "active"

# 9. Deduplication key generation & 10. Upsert behavior
def test_deduplication_and_upsert():
    opp_data = {
        "title": "AI Research Scientist",
        "organization": {"name": "OpenTech"},
        "description": "Initial description.",
        "type": "job",
        "category": "artificial_intelligence",
        "application_url": "https://opentech.ai/jobs/ai-1",
        "source": {"name": "test_dedupe", "external_id": "ext_999"},
        "dates": {"deadline": "2026-12-31T23:59:59Z"}
    }
    # First insert
    doc1, created1 = OpportunityService.upsert_opportunity(opp_data)
    assert created1 is True
    doc1_id = doc1["_id"]

    # Same opportunity with updated description
    opp_data["description"] = "Updated description with new details."
    doc2, created2 = OpportunityService.upsert_opportunity(opp_data)
    assert created2 is False
    assert doc2["_id"] == doc1_id
    assert doc2["description"] == "Updated description with new details."

# 11. Duplicate source records don't create duplicates
def test_duplicate_records_avoided():
    col = OpportunityModel.get_collection()
    initial_count = col.count_documents({"source.name": "test_dupe_check"})

    opp = {
        "title": "Cybersecurity Analyst",
        "organization": {"name": "SecureCorp"},
        "application_url": "https://securecorp.io/careers/1",
        "type": "job",
        "source": {"name": "test_dupe_check", "external_id": "sec_1"}
    }
    OpportunityService.upsert_opportunity(opp)
    OpportunityService.upsert_opportunity(opp)
    OpportunityService.upsert_opportunity(opp)

    final_count = col.count_documents({"source.name": "test_dupe_check"})
    assert final_count == initial_count + 1

# 12. Pagination, 13. Search, 14. Type filter, 15. Location, 16. Category, 17. Sorting
def test_listing_pagination_search_and_filters():
    # Seed 5 opportunities
    for i in range(5):
        OpportunityService.upsert_opportunity({
            "title": f"Test Engineer Alpha {i}",
            "organization": {"name": "Alpha Labs"},
            "type": "internship" if i < 3 else "job",
            "category": "software" if i % 2 == 0 else "data",
            "location": {"city": "Hyderabad" if i < 2 else "Bengaluru", "country": "India", "is_remote": i == 4},
            "work_mode": "Remote" if i == 4 else "Onsite",
            "skills": ["Python", "Docker"] if i < 3 else ["Java", "SQL"],
            "application_url": f"https://alphalabs.com/jobs/{i}",
            "source": {"name": "test_query_seed", "external_id": f"alpha_{i}"},
            "dates": {"deadline": f"2026-11-0{i+1}T00:00:00Z"}
        })

    # Pagination: page 1 limit 2
    res_page = OpportunityService.list_opportunities(page=1, limit=2)
    assert len(res_page["items"]) == 2
    assert res_page["pagination"]["page"] == 1
    assert res_page["pagination"]["limit"] == 2

    # Search by title
    res_search = OpportunityService.list_opportunities(search="Alpha 2")
    assert len(res_search["items"]) == 1
    assert res_search["items"][0]["title"] == "Test Engineer Alpha 2"

    # Type filter: internship
    res_type = OpportunityService.list_opportunities(opp_type="internship")
    for item in res_type["items"]:
        assert item["type"] == "internship"

    # Location filter: Hyderabad
    res_loc = OpportunityService.list_opportunities(location="Hyderabad")
    for item in res_loc["items"]:
        assert "Hyderabad" in item["locationString"]

    # Category filter: data
    res_cat = OpportunityService.list_opportunities(category="data")
    for item in res_cat["items"]:
        assert item["category"] == "data"

    # Remote filter
    res_remote = OpportunityService.list_opportunities(remote=True)
    for item in res_remote["items"]:
        assert item["workMode"] == "Remote" or item.get("location", {}).get("is_remote") is True

    # Sorting by deadline ascending
    res_sort = OpportunityService.list_opportunities(sort_by="deadline")
    deadlines = [it["dates"]["deadline"] for it in res_sort["items"] if it.get("dates", {}).get("deadline")]
    assert deadlines == sorted(deadlines)

# 18. Opportunity detail endpoint & 19. Missing returns 404
def test_opportunity_detail_endpoint(client):
    doc, _ = OpportunityService.upsert_opportunity({
        "title": "Full Stack Dev Intern",
        "organization": {"name": "StartupHQ"},
        "application_url": "https://startuphq.io/jobs/fs1",
        "source": {"name": "test_detail", "external_id": "detail_1"}
    })
    opp_id = str(doc["_id"])

    # Valid get
    res = client.get(f"/api/opportunities/{opp_id}")
    assert res.status_code == 200
    assert res.get_json()["data"]["title"] == "Full Stack Dev Intern"
    assert res.get_json()["data"]["company"] == "StartupHQ"

    # Missing ID returns 404
    res_missing = client.get("/api/opportunities/507f1f77bcf86cd799439011")
    assert res_missing.status_code == 404
    assert res_missing.get_json()["error"] == "OPPORTUNITY_NOT_FOUND"

# 20. Malformed query parameters rejected
def test_malformed_query_parameters(client):
    res_bad_page = client.get("/api/opportunities?page=0")
    assert res_bad_page.status_code == 400

    res_bad_limit = client.get("/api/opportunities?limit=500")
    assert res_bad_limit.status_code == 400

    res_non_int = client.get("/api/opportunities?page=abc")
    assert res_non_int.status_code == 400

# 21. Source failure does not crash ingestion
class BrokenTestSource(OpportunitySource):
    @property
    def name(self) -> str:
        return "test_broken_source"
    def fetch(self):
        raise ConnectionResetError("Simulated provider outage")
    def normalize(self, raw_item):
        return {}

class WorkingTestSource(OpportunitySource):
    @property
    def name(self) -> str:
        return "test_working_source"
    def fetch(self):
        return [{
            "title": "Resilient Opportunity",
            "organization_name": "Resilient Org",
            "application_url": "https://resilient.org/apply",
            "external_id": "res_100"
        }]
    def normalize(self, raw_item):
        return {
            "title": raw_item["title"],
            "organization": {"name": raw_item["organization_name"]},
            "application_url": raw_item["application_url"],
            "source": {"name": self.name, "external_id": raw_item["external_id"]}
        }

def test_source_failure_resilience():
    ingestion = OpportunityIngestionService(sources=[BrokenTestSource(), WorkingTestSource()])
    metrics = ingestion.run_ingestion()

    assert metrics["total_sources"] == 2
    assert metrics["total_accepted"] == 1
    assert len(metrics["errors"]) == 1
    assert metrics["source_results"]["test_broken_source"]["error"] is not None
    assert metrics["source_results"]["test_working_source"]["accepted"] == 1

# 22. Ingestion trigger endpoint
def test_ingestion_api_endpoint(client):
    # Unauthenticated trigger rejected
    res_unauth = client.post("/api/opportunities/ingest")
    assert res_unauth.status_code == 401

    # Authenticated trigger succeeds
    headers = get_auth_headers(client, "ingest_runner@test.edu")
    res_auth = client.post("/api/opportunities/ingest", headers=headers)
    assert res_auth.status_code == 200
    assert res_auth.get_json()["success"] is True
    assert "total_accepted" in res_auth.get_json()["data"]

# 23. Categories and Filters API endpoints
def test_categories_and_filters_endpoints(client):
    res_cat = client.get("/api/opportunities/categories")
    assert res_cat.status_code == 200
    assert isinstance(res_cat.get_json()["data"], list)

    res_filters = client.get("/api/opportunities/filters")
    assert res_filters.status_code == 200
    data = res_filters.get_json()["data"]
    assert "types" in data
    assert "categories" in data
    assert "locations" in data
    assert "work_modes" in data
