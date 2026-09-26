import pytest
from app import create_app
from app.models.user import UserModel

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_auth_workflow(client):
    test_email = "alex_pytest@university.edu"
    test_password = "securePassword!123"

    # Clean existing
    col = UserModel.get_collection()
    col.delete_one({"email": test_email})

    # Register
    res = client.post("/api/auth/register", json={
        "name": "Alex Pytest",
        "email": test_email,
        "password": test_password
    })
    assert res.status_code == 201
    body = res.get_json()
    assert body["success"] is True
    assert "token" in body["data"]
    token = body["data"]["token"]

    # Duplicate rejection
    res_dup = client.post("/api/auth/register", json={
        "name": "Alex Pytest",
        "email": test_email,
        "password": test_password
    })
    assert res_dup.status_code == 409

    # Login
    res_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert res_login.status_code == 200
    assert res_login.get_json()["success"] is True

    # Protected me
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.get_json()["data"]["user"]["email"] == test_email

    # Unauthenticated me
    res_unauth = client.get("/api/auth/me")
    assert res_unauth.status_code == 401
