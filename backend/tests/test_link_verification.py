import socket
import pytest
from unittest.mock import patch, MagicMock
from bson import ObjectId
from app import create_app
from app.config.db import Database
from app.services.link_verification_service import OpportunityLinkVerificationService

@pytest.fixture
def test_app():
    app = create_app()
    app.config["TESTING"] = True
    return app

@pytest.fixture
def test_client(test_app):
    return test_app.test_client()

def test_ssrf_protection_blocks_private_and_metadata_ips():
    """Ensures private RFC-1918 IPs, loopbacks, and cloud metadata are strictly blocked."""
    # Loopback
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://127.0.0.1:5000/secret")
    assert not safe
    assert "loopback" in err.lower() or "prohibited" in err.lower()

    safe, err = OpportunityLinkVerificationService.is_safe_url("http://localhost:8080/admin")
    assert not safe

    # Cloud metadata
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://169.254.169.254/latest/meta-data/")
    assert not safe
    assert "metadata" in err.lower() or "link-local" in err.lower() or "prohibited" in err.lower()

    # Private IP
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://192.168.1.100/router")
    assert not safe

    safe, err = OpportunityLinkVerificationService.is_safe_url("http://10.0.0.5/api")
    assert not safe

    # Non-HTTP/HTTPS protocol
    safe, err = OpportunityLinkVerificationService.is_safe_url("file:///etc/passwd")
    assert not safe
    assert "scheme" in err.lower() or "unsupported" in err.lower()

    safe, err = OpportunityLinkVerificationService.is_safe_url("ftp://ftp.example.com/test")
    assert not safe

def test_ssrf_blocks_unusual_ip_encodings():
    """Blocks decimal, hex, and octal integer IP representations pointing to loopback/private."""
    # Decimal 2130706433 == 127.0.0.1
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://2130706433/admin")
    assert not safe
    assert "prohibited" in err.lower() or "loopback" in err.lower()

    # Hex 0x7f000001 == 127.0.0.1
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://0x7f000001/secret")
    assert not safe
    assert "prohibited" in err.lower() or "loopback" in err.lower()

    # Octal 0177.0.0.1 == 127.0.0.1
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://0177.0.0.1/status")
    assert not safe
    assert "prohibited" in err.lower() or "loopback" in err.lower()

def test_ssrf_blocks_ipv6_and_ipv4_mapped():
    """Blocks IPv6 loopbacks and IPv4-mapped private/loopback addresses."""
    # IPv6 loopback
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://[::1]:8080/metrics")
    assert not safe

    # IPv4-mapped IPv6 loopback
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://[::ffff:127.0.0.1]/status")
    assert not safe

    # IPv4-mapped IPv6 cloud metadata
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://[::ffff:169.254.169.254]/meta")
    assert not safe

def test_ssrf_blocks_embedded_credentials():
    """Blocks URLs with embedded username/passwords."""
    safe, err = OpportunityLinkVerificationService.is_safe_url("http://admin:secret123@example.com/jobs")
    assert not safe
    assert "credentials" in err.lower()

def test_ssrf_allows_public_web_urls():
    """Allows standard public web URLs."""
    with patch("socket.getaddrinfo", return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("142.250.190.46", 443))]):
        safe, err = OpportunityLinkVerificationService.is_safe_url("https://www.google.com")
        assert safe
        assert err is None

def test_redirect_to_private_ip_is_blocked():
    """Verifies that redirect hops to localhost/private IPs are detected and blocked before connection."""
    # Simulate first hop responding with 302 pointing to localhost
    mock_resp = MagicMock()
    mock_resp.status_code = 302
    mock_resp.headers = {"Location": "http://127.0.0.1:8000/internal-dashboard"}

    with patch("socket.getaddrinfo", return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]), \
         patch("requests.Session.head", return_value=mock_resp):
        res = OpportunityLinkVerificationService.verify_url("https://public-site.com/redirect")
        assert res["status"] == "blocked"
        assert res["is_expired"] is False  # Blocked request is not expired!
        assert "unsafe destination blocked" in res["error_reason"].lower()

def test_keyword_expiry_avoiding_false_positives():
    """
    Ensures that generic words like 'closed' in body text do not trigger false expiration,
    while explicit phrases in headings (e.g. <title>Position has been filled</title>) correctly do.
    """
    # 1. Page with generic word "closed" (e.g. "We are closed on weekends")
    generic_html = b"<html><head><title>Senior Engineer Careers</title></head><body>Our offices are closed on bank holidays. Apply below!</body></html>"
    mock_resp_200 = MagicMock()
    mock_resp_200.status_code = 200
    mock_resp_200.__enter__.return_value = mock_resp_200
    mock_resp_200.iter_content.return_value = iter([generic_html])

    with patch("socket.getaddrinfo", return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]), \
         patch("requests.Session.head", return_value=mock_resp_200), \
         patch("requests.Session.get", return_value=mock_resp_200):
        res = OpportunityLinkVerificationService.verify_url("https://example.com/jobs/senior-dev")
        assert res["status"] == "verified"
        assert res["is_expired"] is False

    # 2. Page with explicit title "Position has been filled"
    expired_html = b"<html><head><title>Position has been filled - Archive</title></head><body>Thank you for your interest.</body></html>"
    mock_resp_expired = MagicMock()
    mock_resp_expired.status_code = 200
    mock_resp_expired.__enter__.return_value = mock_resp_expired
    mock_resp_expired.iter_content.return_value = iter([expired_html])

    with patch("socket.getaddrinfo", return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]), \
         patch("requests.Session.head", return_value=mock_resp_expired), \
         patch("requests.Session.get", return_value=mock_resp_expired):
        res = OpportunityLinkVerificationService.verify_url("https://example.com/jobs/closed-dev")
        assert res["status"] == "expired"
        assert res["is_expired"] is True

def test_timeout_and_403_do_not_mark_expired():
    """Blocked access (403) or timeouts must remain distinct and NOT be labeled as expired."""
    mock_403 = MagicMock()
    mock_403.status_code = 403

    with patch("socket.getaddrinfo", return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]), \
         patch("requests.Session.head", return_value=mock_403):
        res = OpportunityLinkVerificationService.verify_url("https://protected-site.com/jobs")
        assert res["status"] == "blocked"
        assert res["is_expired"] is False  # Must NOT be marked expired

def test_opportunity_link_verification_flow(test_client):
    db = Database.get_db()

    # Seed test opportunity with public URL
    res = db.opportunities.insert_one({
        "title": "Software Engineering Intern",
        "company": "Public Tech Org",
        "application_url": "https://example.com/status/200",
        "status": "active"
    })
    opp_id = str(res.inserted_id)

    mock_200 = MagicMock()
    mock_200.status_code = 200
    mock_200.__enter__.return_value = mock_200
    mock_200.iter_content.return_value = iter([b"<html><head><title>Apply Now</title></head><body>Careers</body></html>"])

    try:
        # 1. API endpoint verify-link
        with patch("socket.getaddrinfo", return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]), \
             patch("requests.Session.head", return_value=mock_200), \
             patch("requests.Session.get", return_value=mock_200):
            api_res = test_client.get(f"/api/opportunities/{opp_id}/verify-link")
            assert api_res.status_code == 200
            data = api_res.get_json()["data"]
            assert "status" in data
            assert "last_verified_at" in data

        # 2. Check cached in Mongo
        cached_opp = db.opportunities.find_one({"_id": res.inserted_id})
        assert "link_verification" in cached_opp
        assert cached_opp["link_verification"]["last_verified_at"] is not None

        # 3. Subsequent call should hit cache quickly
        api_res_cached = test_client.get(f"/api/opportunities/{opp_id}/verify-link")
        assert api_res_cached.status_code == 200
        cached_data = api_res_cached.get_json()["data"]
        assert cached_data["last_verified_at"] == data["last_verified_at"]

    finally:
        db.opportunities.delete_many({"_id": res.inserted_id})
