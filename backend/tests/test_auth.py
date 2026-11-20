def test_registration_creates_candidate(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "new-candidate@example.test",
            "password": "candidate-password-1",
            "first_name": "New",
            "last_name": "Candidate",
        },
    )

    assert response.status_code == 201
    assert response.json()["user"]["email"] == "new-candidate@example.test"
    assert response.json()["user"]["role"] == "candidate"


def test_registration_rejects_duplicate_email(client, user_factory):
    user = user_factory(email="duplicate@example.test")

    response = client.post(
        "/auth/register",
        json={
            "email": user.email,
            "password": "candidate-password-1",
            "first_name": "Duplicate",
            "last_name": "Candidate",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email is already registered."


def test_login_returns_usable_bearer_token(
    client,
    user_factory,
):
    user = user_factory(email="login@example.test", password="correct-password")

    response = client.post(
        "/auth/login",
        json={"email": user.email, "password": "correct-password"},
    )

    assert response.status_code == 200
    token = response.json()["token"]["access_token"]
    assert response.json()["token"]["token_type"] == "bearer"

    profile_response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["id"] == str(user.id)


def test_login_rejects_wrong_password(client, user_factory):
    user = user_factory(email="wrong-password@example.test")

    response = client.post(
        "/auth/login",
        json={"email": user.email, "password": "incorrect-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials."


def test_login_rejects_inactive_user(client, user_factory):
    user = user_factory(
        email="inactive@example.test",
        is_active=False,
        password="correct-password",
    )

    response = client.post(
        "/auth/login",
        json={"email": user.email, "password": "correct-password"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "User is inactive."


def test_registration_normalizes_email_and_rejects_weak_password(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "  Person@Example.TEST ",
            "password": "strong-password-123",
            "first_name": " Person ",
            "last_name": " Test ",
        },
    )
    assert response.status_code == 201
    assert response.json()["user"]["email"] == "person@example.test"

    weak = client.post(
        "/auth/register",
        json={
            "email": "weak@example.test",
            "password": "onlylettersxx",
            "first_name": "Weak",
            "last_name": "Password",
        },
    )
    assert weak.status_code == 422


def test_authenticated_user_can_change_password(client, user_factory, authenticated_headers):
    user = user_factory(password="current-password-1")
    response = client.post(
        "/auth/change-password",
        headers=authenticated_headers(user),
        json={"current_password": "current-password-1", "new_password": "new-password-123"},
    )
    assert response.status_code == 204
    assert client.post("/auth/login", json={"email": user.email, "password": "current-password-1"}).status_code == 401
    assert client.post("/auth/login", json={"email": user.email, "password": "new-password-123"}).status_code == 200


def test_change_password_rejects_wrong_current_password(client, candidate_headers):
    response = client.post(
        "/auth/change-password",
        headers=candidate_headers,
        json={"current_password": "wrong-password-1", "new_password": "new-password-123"},
    )
    assert response.status_code == 401
