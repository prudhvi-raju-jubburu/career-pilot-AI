import pytest
from app import create_app
from app.config.db import Database
from app.models.user import UserModel
from app.models.notification import NotificationModel
from app.utils.auth import generate_token
from app.socket import socketio, extract_token_from_handshake

@pytest.fixture
def test_app():
    app = create_app()
    app.config["TESTING"] = True
    return app

@pytest.fixture
def setup_user():
    db = Database.get_db()
    email = "socket_test_student@example.com"
    db.users.delete_many({"email": email})
    user = UserModel.create_user(name="Socket Student", email=email, password="Password123!")
    user_id = str(user["_id"])
    yield user_id, email
    db.users.delete_many({"_id": user["_id"]})
    db.notifications.delete_many({"user_id": user_id})

def test_extract_token_from_handshake(test_app):
    with test_app.test_request_context("/"):
        token = extract_token_from_handshake({"token": "jwt_test_token"})
        assert token == "jwt_test_token"

def test_socketio_auth_connection_rejection(test_app):
    """Unauthenticated socket connection must be rejected."""
    client = socketio.test_client(test_app)
    # Without valid token in handshake, connection fails / is not connected
    assert not client.is_connected()

def test_socketio_auth_connection_success(test_app, setup_user):
    """Authenticated socket connection with valid JWT succeeds and joins room."""
    user_id, email = setup_user
    with test_app.app_context():
        token = generate_token(user_id, email)

    client = socketio.test_client(test_app, auth={"token": token})
    assert client.is_connected()

    # Client should receive 'connected' event
    received = client.get_received()
    connected_events = [e for e in received if e["name"] == "connected"]
    assert len(connected_events) == 1
    assert connected_events[0]["args"][0]["status"] == "authenticated"
    assert connected_events[0]["args"][0]["user_id"] == user_id

    client.disconnect()

def test_socketio_notification_lifecycle_events(test_app, setup_user):
    """Creating and updating notifications dispatches socket events to user room."""
    user_id, email = setup_user
    with test_app.app_context():
        token = generate_token(user_id, email)

    client = socketio.test_client(test_app, auth={"token": token})
    assert client.is_connected()

    # Clear initial connection events
    client.get_received()

    with test_app.app_context():
        # 1. Create notification
        notif = NotificationModel.create_notification(
            user_id=user_id,
            title="Real-Time Internship Alert",
            message="95% match with your profile",
            notif_type="new_matching_opportunity"
        )
        assert notif is not None

        # Check client received notification:new event
        received = client.get_received()
        new_events = [e for e in received if e["name"] == "notification:new"]
        assert len(new_events) >= 1
        assert new_events[0]["args"][0]["title"] == "Real-Time Internship Alert"

        # 2. Mark notification read
        NotificationModel.mark_read(notif["id"], user_id)
        received = client.get_received()
        read_events = [e for e in received if e["name"] == "notification:read"]
        assert len(read_events) >= 1
        assert read_events[0]["args"][0]["id"] == notif["id"]

        # 3. Mark all read
        NotificationModel.mark_all_read(user_id)
        received = client.get_received()
        read_all_events = [e for e in received if e["name"] == "notification:read_all"]
        assert len(read_all_events) >= 1

        # 4. Delete notification
        NotificationModel.delete_notification(notif["id"], user_id)
        received = client.get_received()
        deleted_events = [e for e in received if e["name"] == "notification:deleted"]
        assert len(deleted_events) >= 1
        assert deleted_events[0]["args"][0]["id"] == notif["id"]

    client.disconnect()

def test_socketio_cross_user_isolation(test_app):
    """
    Two independent authenticated users must be completely isolated in private rooms.
    User 2 must NEVER receive real-time notifications dispatched to User 1.
    """
    db = Database.get_db()
    email_1 = "student_alpha@example.com"
    email_2 = "student_beta@example.com"
    db.users.delete_many({"email": {"$in": [email_1, email_2]}})

    u1 = UserModel.create_user(name="Student Alpha", email=email_1, password="PasswordAlpha123")
    u2 = UserModel.create_user(name="Student Beta", email=email_2, password="PasswordBeta123")
    u1_id = str(u1["_id"])
    u2_id = str(u2["_id"])

    with test_app.app_context():
        token_1 = generate_token(u1_id, email_1)
        token_2 = generate_token(u2_id, email_2)

    c1 = socketio.test_client(test_app, auth={"token": token_1})
    c2 = socketio.test_client(test_app, auth={"token": token_2})

    assert c1.is_connected()
    assert c2.is_connected()

    # Flush connection welcome events
    c1.get_received()
    c2.get_received()

    try:
        with test_app.app_context():
            # Create a notification specifically for User 1
            notif = NotificationModel.create_notification(
                user_id=u1_id,
                title="Alpha Exclusive Offer",
                message="Private offer for Student Alpha",
                notif_type="opportunity"
            )

            # User 1 MUST receive event
            rec1 = c1.get_received()
            new1 = [e for e in rec1 if e["name"] == "notification:new"]
            assert len(new1) >= 1
            assert new1[0]["args"][0]["title"] == "Alpha Exclusive Offer"

            # User 2 MUST receive NOTHING
            rec2 = c2.get_received()
            new2 = [e for e in rec2 if e["name"] == "notification:new"]
            assert len(new2) == 0

    finally:
        c1.disconnect()
        c2.disconnect()
        db.users.delete_many({"_id": {"$in": [u1["_id"], u2["_id"]]}})
        db.notifications.delete_many({"user_id": {"$in": [u1_id, u2_id]}})


