from app.models.candidate_profile import CandidateProfile


def test_candidate_saved_jobs_are_unique_idempotent_and_removable(client, candidate_headers, candidate_user, company, admin_user, job_factory):
    job = job_factory(company, admin_user)
    saved = client.post(f"/api/saved-jobs/{job.id}", headers=candidate_headers)
    assert saved.status_code == 201
    repeated = client.post(f"/api/saved-jobs/{job.id}", headers=candidate_headers)
    assert repeated.status_code == 201
    listed = client.get("/api/saved-jobs/", headers=candidate_headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["job"]["id"] == str(job.id)
    assert client.delete(f"/api/saved-jobs/{job.id}", headers=candidate_headers).status_code == 204


def test_saved_jobs_require_candidate_role(client, hr_headers, company, admin_user, job_factory):
    job = job_factory(company, admin_user)
    response = client.post(f"/api/saved-jobs/{job.id}", headers=hr_headers)
    assert response.status_code == 403


def test_hr_lists_only_jobs_for_managed_companies(client, hr_headers, hr_user, hr_company, company_factory, job_factory, admin_user):
    visible = job_factory(hr_company, hr_user)
    other_company = company_factory(admin_user)
    hidden = job_factory(other_company, admin_user)

    response = client.get("/api/jobs/me", headers=hr_headers)
    assert response.status_code == 200
    ids = {item["id"] for item in response.json()["items"]}
    assert str(visible.id) in ids
    assert str(hidden.id) not in ids


def test_hr_can_update_managed_job_without_replacing_its_identity(client, hr_headers, hr_company, hr_user, job_factory):
    job = job_factory(hr_company, hr_user)
    response = client.patch(f"/api/jobs/{job.id}", headers=hr_headers, json={
        "title": "Senior Backend Engineer",
        "description": "Design and build reliable backend services.",
        "location": "Hybrid",
        "work_mode": "hybrid",
        "employment_type": "full_time",
        "experience_level": "senior",
        "min_experience": 5,
        "max_experience": 8,
        "min_salary": 120000,
        "max_salary": 160000,
        "skills": ["Python", "PostgreSQL"],
        "status": "published",
        "is_active": True,
    })

    assert response.status_code == 200
    assert response.json()["id"] == str(job.id)
    assert response.json()["company_id"] == str(hr_company.id)
    assert response.json()["min_salary"] == 120000
    assert response.json()["max_salary"] == 160000


def test_job_responses_include_company_logo_for_existing_job_cards(client, hr_headers, hr_company, hr_user, job_factory):
    job = job_factory(hr_company, hr_user)
    response = client.get("/api/jobs?page=1&page_size=10")

    assert response.status_code == 200
    item = next(item for item in response.json()["items"] if item["id"] == str(job.id))
    assert item["company"] == {
        "name": hr_company.name,
        "logo_url": hr_company.logo_url,
    }


def test_public_jobs_only_lists_published_jobs_and_hides_draft_details(client, company, admin_user, job_factory, admin_headers):
    published = job_factory(company, admin_user)
    draft = job_factory(company, admin_user, status="draft")

    listed = client.get("/api/jobs?status=draft")
    assert listed.status_code == 200
    ids = {item["id"] for item in listed.json()["items"]}
    assert str(published.id) in ids
    assert str(draft.id) not in ids

    hidden_from_public = client.get(f"/api/jobs/{draft.id}")
    assert hidden_from_public.status_code == 404
    visible_to_company = client.get(f"/api/jobs/{draft.id}", headers=admin_headers)
    assert visible_to_company.status_code == 200


def test_register_can_choose_candidate_or_hr_but_not_admin(client):
    for role in ("candidate", "hr"):
        response = client.post("/auth/register", json={
            "email": f"{role}-register@example.test",
            "password": "correct-horse-battery",
            "first_name": "New",
            "last_name": "Account",
            "role": role,
        })
        assert response.status_code == 201
        assert response.json()["user"]["role"] == role

    denied = client.post("/auth/register", json={
        "email": "admin-register@example.test",
        "password": "correct-horse-battery",
        "first_name": "New",
        "last_name": "Admin",
        "role": "admin",
    })
    assert denied.status_code == 422


def test_hr_company_creation_creates_owner_membership(client, hr_headers, hr_user, db):
    response = client.post("/companies/", headers=hr_headers, json={
        "name": "New hiring company",
        "description": "A company with an HR owner.",
        "website": "https://owner-membership.example.test",
        "location": "Remote",
        "logo_url": "https://example.test/logo.png",
        "industry": "software",
        "company_size": "1-10",
    })
    assert response.status_code == 201
    company_id = response.json()["details"]["id"]
    created_job = client.post(f"/api/companies/{company_id}/jobs", headers=hr_headers, json={
        "title": "First role", "description": "Build products.", "location": "Remote",
        "work_mode": "remote", "employment_type": "full_time", "experience_level": "entry",
        "skills": [], "status": "draft",
    })
    assert created_job.status_code == 201


def test_hr_without_company_is_guided_to_onboarding_and_cannot_post_job(client, hr_headers):
    assert client.get("/companies/me", headers=hr_headers).json() is None
    response = client.post("/api/jobs", headers=hr_headers, json={
        "title": "First role", "description": "Build products.", "location": "Remote",
        "work_mode": "remote", "employment_type": "full_time", "experience_level": "entry",
        "skills": [], "status": "draft",
    })
    assert response.status_code == 409
    assert response.json()["detail"] == "Create or join a company before posting a job."


def test_hr_job_creation_derives_company_from_owner_membership(client, hr_headers, hr_user):
    created_company = client.post("/companies/", headers=hr_headers, json={
        "name": "Membership assigned company", "description": "HR owned company.",
        "website": "https://membership-assigned.example.test", "location": "Remote",
        "logo_url": "", "industry": "software", "company_size": "1-10",
    })
    assert created_company.status_code == 201
    company = client.get("/companies/me", headers=hr_headers)
    assert company.status_code == 200
    company_id = company.json()["id"]
    payload = {
        "title": "Automatically assigned role", "description": "Build products.",
        "location": "Remote", "work_mode": "remote", "employment_type": "full_time",
        "experience_level": "entry", "skills": [], "status": "draft",
        "company_id": "00000000-0000-0000-0000-000000000000",
    }

    response = client.post("/api/jobs", headers=hr_headers, json=payload)

    assert response.status_code == 201
    assert response.json()["company_id"] == company_id
    assert response.json()["created_by"] == str(hr_user.id)
    assert response.json()["status"] == "draft"


def test_multiple_active_company_memberships_are_not_silently_resolved(
    client, hr_headers, hr_user, hr_company, company_factory, membership_factory,
):
    another_company = company_factory(hr_user)
    membership_factory(another_company, hr_user)

    company = client.get("/companies/me", headers=hr_headers)
    job = client.post("/api/jobs", headers=hr_headers, json={
        "title": "Role", "description": "Build products.", "location": "Remote",
        "work_mode": "remote", "employment_type": "full_time", "experience_level": "entry",
        "skills": [], "status": "draft",
    })

    assert company.status_code == 409
    assert "more than one active company membership" in company.json()["detail"]
    assert job.status_code == 409


def test_hr_can_create_a_published_job(client, hr_headers, hr_user):
    client.post("/companies/", headers=hr_headers, json={
        "name": "Published job company", "description": "Company for a public role.",
        "website": "https://published-role.example.test", "location": "Remote",
        "logo_url": "", "industry": "software", "company_size": "1-10",
    })
    response = client.post("/api/jobs", headers=hr_headers, json={
        "title": "Public role", "description": "Build products.", "location": "Remote",
        "work_mode": "remote", "employment_type": "full_time", "experience_level": "entry",
        "skills": [], "status": "published",
    })
    assert response.status_code == 201
    assert response.json()["status"] == "published"


def test_admin_job_creation_still_uses_admin_company_membership(client, admin_headers, admin_user, company, membership_factory):
    membership_factory(company, admin_user)
    response = client.post("/api/jobs", headers=admin_headers, json={
        "title": "Admin assigned role", "description": "Build products.", "location": "Remote",
        "work_mode": "remote", "employment_type": "full_time", "experience_level": "entry",
        "skills": [], "status": "draft",
    })
    assert response.status_code == 201
    assert response.json()["company_id"] == str(company.id)


def test_hr_review_lists_candidate_profile_and_resume_metadata(client, hr_headers, hr_company, hr_user, candidate_user, job_factory, application_factory, db):
    job = job_factory(hr_company, hr_user)
    application = application_factory(job, candidate_user)
    db.add(CandidateProfile(user_id=candidate_user.id, headline="Python developer", experience_years=4, location="Delhi"))
    db.flush()
    response = client.get(f"/api/jobs/{job.id}/applications/review", headers=hr_headers)
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["candidate_name"] == "Test User"
    assert item["profile"]["experience_years"] == 4
    assert item["resume_file_name"] == "resume.pdf"
    assert item["id"] == str(application.id)


def test_recruiter_can_download_resume_for_managed_application(client, hr_headers, hr_company, hr_user, candidate_user, job_factory, application_factory, db, monkeypatch):
    import io
    import app.services.application_service as application_service

    job = job_factory(hr_company, hr_user)
    application = application_factory(job, candidate_user)
    application.resume.file_url = "resumes/candidate/test.pdf"
    db.flush()

    async def fake_download(key):
        assert key == "resumes/candidate/test.pdf"
        return io.BytesIO(b"resume bytes")

    monkeypatch.setattr(application_service, "download_resume", fake_download)
    response = client.get(f"/api/applications/{application.id}/resume", headers=hr_headers)
    assert response.status_code == 200
    assert response.content == b"resume bytes"


def test_hr_cannot_read_applicant_details_for_unmanaged_company(client, hr_headers, hr_user, admin_user, company_factory, job_factory, candidate_user, application_factory):
    company = company_factory(admin_user)
    job = job_factory(company, admin_user)
    application_factory(job, candidate_user)
    response = client.get(f"/api/jobs/{job.id}/applications/review", headers=hr_headers)
    assert response.status_code == 403


def test_hr_cannot_download_resume_for_unmanaged_application(client, hr_headers, admin_user, company_factory, job_factory, candidate_user, application_factory):
    company = company_factory(admin_user)
    job = job_factory(company, admin_user)
    application = application_factory(job, candidate_user)
    response = client.get(f"/api/applications/{application.id}/resume", headers=hr_headers)
    assert response.status_code == 403
