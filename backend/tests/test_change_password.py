import pytest
from app import create_app
from app.config.db import Database
from app.models.user import UserModel
from app.utils.auth import generate_token

@pytest.fixture
def test_app():
    app = create_app()
    app.config["TESTING"] = True
    return app

@pytest.fixture
def test_client(test_app):
    return test_app.test_client()

@pytest.fixture
def setup_user():
    db = Database.get_db()
    email = "pwd_test_user@example.com"
    db.users.delete_many({"email": email})
    user = UserModel.create_user(name="Password Tester", email=email, password="InitialPassword123")
    user_id = str(user["_id"])
    yield user_id, email
    db.users.delete_many({"_id": user["_id"]})

def test_change_password_workflow(test_client, setup_user, test_app):
    user_id, email = setup_user
    with test_app.app_context():
        token = generate_token(user_id, email)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Missing current password
    res = test_client.post("/api/auth/change-password", headers=headers, json={"new_password": "NewSecret123"})
    assert res.status_code == 400
    assert "current password is required" in res.get_json()["message"].lower()

    # 2. Too short new password (< 6 chars)
    res = test_client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "InitialPassword123",
        "new_password": "123"
    })
    assert res.status_code == 400
    assert "at least 6 characters" in res.get_json()["message"].lower()

    # 3. Incorrect current password
    res = test_client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "WrongPassword!",
        "new_password": "BrandNewPassword123"
    })
    assert res.status_code == 401
    assert "incorrect current password" in res.get_json()["message"].lower()

    # 4. Same as current password
    res = test_client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "InitialPassword123",
        "new_password": "InitialPassword123"
    })
    assert res.status_code == 400
    assert "cannot be identical" in res.get_json()["message"].lower()

    # 5. Successful password change
    res = test_client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "InitialPassword123",
        "new_password": "BrandNewPassword123"
    })
    assert res.status_code == 200
    assert res.get_json()["success"] is True

    # 6. Verify login works with new password
    login_res = test_client.post("/api/auth/login", json={
        "email": email,
        "password": "BrandNewPassword123"
    })
    assert login_res.status_code == 200
    assert login_res.get_json()["success"] is True

    # 7. Old password no longer works
    old_login_res = test_client.post("/api/auth/login", json={
        "email": email,
        "password": "InitialPassword123"
    })
    assert old_login_res.status_code == 401

