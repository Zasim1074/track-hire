def test_registration_creates_candidate(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "new-candidate@example.test",
            "password": "candidate-password",
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
            "password": "candidate-password",
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
