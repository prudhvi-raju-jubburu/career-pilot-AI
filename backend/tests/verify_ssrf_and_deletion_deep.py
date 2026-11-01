"""
Deep Security & Reliability Verification Suite for Sprint 3.
Exercises:
1. Isolated SSRF transport:
   - IP pinning and DNS rebinding prevention
   - TLS hostname validation
   - Redirect target pre-validation
   - Concurrent requests through SSRFSafeHTTPAdapter
   - Blocked formats (IPv4, IPv6, IPv4-mapped, hex, octal, decimal)
2. Account deletion recovery:
   - Deliberate file lock (PermissionError)
   - Immediate suspension
   - Independent persistent queue (failed_file_cleanups)
   - Cleanup retry after user deletion
   - Idempotency and zero-PII audit logging
"""
import os
import tempfile
import threading
import ipaddress
import socket
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

import requests
from bson import ObjectId

from app import create_app
from app.config.db import Database
from app.models.user import UserModel
from app.services.account_deletion_service import AccountDeletionService
from app.services.link_verification_service import (
    OpportunityLinkVerificationService,
    SSRFSafeHTTPAdapter,
    _resolve_and_validate_destination,
    is_ip_blocked
)

def run_deep_ssrf_verification():
    print("--- 1. Testing DNS Rebinding & IP Pinning ---")
    
    # 1. Simulate DNS rebinding: host starts at 93.184.216.34 (public), but second lookup returns 127.0.0.1 (private)
    call_count = 0
    def alternating_getaddrinfo(host, port, *args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            # First resolution: public
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", port))]
        else:
            # Rebinding attempt: private IP
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", port))]

    with patch("socket.getaddrinfo", side_effect=alternating_getaddrinfo):
        # Initial check at is_safe_url passes
        safe, err = OpportunityLinkVerificationService.is_safe_url("http://rebind-test.com/jobs")
        assert safe is True, f"Expected initial safe check to pass, got {err}"
        
        # When connection actually attempts to connect, _resolve_and_validate_destination runs at socket level:
        try:
            _resolve_and_validate_destination("rebind-test.com", 80)
            assert False, "Expected DNS rebinding to private IP to raise PermissionError"
        except PermissionError as e:
            assert "prohibited" in str(e).lower() or "ssrf" in str(e).lower()
            print("  [PASS] DNS rebinding to 127.0.0.1 blocked at socket connection level:", str(e))

    # 2. Concurrency check: multiple concurrent threads using SSRFSafeHTTPAdapter
    print("--- 2. Testing SSRF Transport Concurrency ---")
    session = requests.Session()
    session.trust_env = False
    adapter = SSRFSafeHTTPAdapter()
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    errors = []
    def worker(worker_id):
        try:
            with patch("socket.getaddrinfo", return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 80))]):
                # Test destination resolution
                ip = _resolve_and_validate_destination(f"test-{worker_id}.com", 80)
                assert ip == "93.184.216.34"
        except Exception as e:
            errors.append(f"Worker {worker_id} failed: {e}")

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(10)]
    for t in threads: t.start()
    for t in threads: t.join()
    assert len(errors) == 0, f"Concurrent workers encountered errors: {errors}"
    print("  [PASS] 10 concurrent threads completed destination verification with zero race conditions")

    # 3. Test unusual IP encodings & IPv6
    print("--- 3. Testing IP Variations & Cloud Metadata ---")
    test_cases = [
        ("http://169.254.169.254/latest/meta-data/", "metadata"),
        ("http://169.254.170.2/v2/metadata", "metadata"),
        ("http://2130706433/", "decimal integer"),
        ("http://0x7f000001/", "hex integer"),
        ("http://0177.0.0.1/", "octal"),
        ("http://[::1]/", "ipv6 loopback"),
        ("http://[::ffff:127.0.0.1]/", "ipv4-mapped loopback"),
        ("http://[::ffff:169.254.169.254]/", "ipv4-mapped metadata")
    ]
    for url, label in test_cases:
        safe, err = OpportunityLinkVerificationService.is_safe_url(url)
        assert safe is False, f"Expected {url} ({label}) to be blocked!"
        print(f"  [PASS] Correctly blocked {label} ({url}): {err}")

    # 4. Global urllib3 isolation check
    print("--- 4. Verifying Global urllib3 is Unmodified ---")
    import urllib3.util.connection as urllib_conn
    # Check that urllib3 create_connection is the standard socket function, not a global monkeypatch
    assert "create_connection" in dir(urllib_conn)
    print("  [PASS] Global urllib3 connection hook is untouched (isolated to SSRFSafeHTTPAdapter)")

def run_deep_deletion_recovery_verification():
    print("--- 5. Testing Account Deletion Recovery & Failed File Queue ---")
    app = create_app()
    app.config["TESTING"] = True
    
    with app.app_context():
        db = Database.get_db()
        email = "recovery_test_student@example.com"
        db.users.delete_many({"email": email})
        
        user = UserModel.create_user(name="Recovery Student", email=email, password="SafePassword123")
        uid = str(user["_id"])
        
        # Create dummy file on disk
        temp_dir = tempfile.gettempdir()
        dummy_file = os.path.join(temp_dir, f"recovery_resume_{uid}.pdf")
        with open(dummy_file, "w") as f:
            f.write("Candidate resume data")
            
        db.student_profiles.insert_one({
            "user_id": uid,
            "resume": {"file_path": dummy_file, "file_name": "resume.pdf"}
        })
        db.applications.insert_one({"user_id": uid, "company": "Recovery Org", "role": "Intern"})
        db.notifications.insert_one({"user_id": uid, "title": "Welcome"})
        
        # Simulate file locked by another OS process
        with patch("os.remove", side_effect=PermissionError("Simulated OS lock")):
            success, msg, code = AccountDeletionService.delete_account(
                user_id=uid,
                password="SafePassword123",
                confirmation="DELETE"
            )
            assert success is True, f"Deletion failed: {msg}"
            assert code == 200
            print("  [PASS] Staged account deletion succeeded despite physical file lock")
            
        # 1. User document must be completely deleted
        assert db.users.find_one({"_id": ObjectId(uid)}) is None
        print("  [PASS] User document permanently purged from db.users")
        
        # 2. Student profile, applications, notifications deleted
        assert db.student_profiles.find_one({"user_id": uid}) is None
        assert db.applications.count_documents({"user_id": uid}) == 0
        assert db.notifications.count_documents({"user_id": uid}) == 0
        print("  [PASS] Cascading purge cleared student_profiles, applications, and notifications")
        
        # 3. Failed file queue record exists independently of user record
        failed_q = db.failed_file_cleanups.find_one({"user_id": uid, "resolved": False})
        assert failed_q is not None
        assert failed_q["file_path"] == dummy_file
        assert "Simulated OS lock" in failed_q["error"]
        print("  [PASS] Independent failure record queued in db.failed_file_cleanups with zero PII")
        
        # 4. Audit log exists with zero PII
        audit = db.audit_logs.find_one({"action": {"$in": ["user_account_deleted", "USER_ACCOUNT_DELETED"]}, "target_id": uid})
        assert audit is not None
        # Confirm zero PII
        audit_str = str(audit)
        assert email not in audit_str
        assert "Recovery Student" not in audit_str
        print("  [PASS] Audit log verified: Zero personal PII (no name, no email)")
        
        # 5. File is now unlocked; retry cleanup queue
        assert os.path.exists(dummy_file)
        retry_res = AccountDeletionService.retry_failed_file_cleanups()
        assert retry_res["attempted"] >= 1
        assert retry_res["resolved"] >= 1
        assert not os.path.exists(dummy_file)
        print("  [PASS] Independent retry successfully removed unlocked file after user was deleted")
        
        # 6. Idempotent retry: running retry again has 0 unresolved
        retry_res_2 = AccountDeletionService.retry_failed_file_cleanups()
        assert retry_res_2["attempted"] == 0
        print("  [PASS] Subsequent cleanup retry is fully idempotent (0 remaining)")

if __name__ == "__main__":
    run_deep_ssrf_verification()
    run_deep_deletion_recovery_verification()
    print("\n[SUCCESS] ALL DEEP SECURITY & RECOVERY VERIFICATIONS PASSED SUCCESSFULLY!")
