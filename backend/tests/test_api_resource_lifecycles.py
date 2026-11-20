from datetime import datetime, timedelta, timezone

from app.models.application import ApplicationStatus
from app.models.company_membership import MembershipRole
from app.models.interview import InterviewStatus
from app.models.job import JobStatus
from app.models.resume import Resume


def test_candidate_profile_create_get_and_update(client, candidate_headers):
    created = client.post(
        "/candidates/me",
        headers=candidate_headers,
        json={"headline": "Backend engineer", "location": "Bengaluru", "experience_years": 3},
    )
    assert created.status_code == 201

    fetched = client.get("/candidates/me", headers=candidate_headers)
    assert fetched.status_code == 200
    assert fetched.json()["headline"] == "Backend engineer"

    updated = client.patch(
        "/candidates/me",
        headers=candidate_headers,
        json={"headline": "Senior backend engineer", "experience_years": 4},
    )
    assert updated.status_code == 200
    assert updated.json()["headline"] == "Senior backend engineer"


def test_company_read_update_list_and_delete(
    client, hr_headers, hr_user, company_factory
):
    company = company_factory(hr_user, name="Lifecycle Company")

    fetched = client.get(f"/companies/{company.id}")
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Lifecycle Company"

    listed = client.get("/companies/?search=Lifecycle")
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    updated = client.patch(
        f"/companies/{company.id}",
        headers=hr_headers,
        json={
            "name": "Lifecycle Company Updated",
            "description": "Updated company profile.",
            "website": company.website,
            "location": "Hybrid",
            "logo_url": company.logo_url,
            "industry": "software",
            "company_size": "11-50",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["location"] == "Hybrid"

    deleted = client.delete(f"/companies/{company.id}", headers=hr_headers)
    assert deleted.status_code == 204


def test_company_membership_add_list_update_and_delete(
    client,
    hr_headers,
    hr_user,
    user_factory,
    company_factory,
    membership_factory,
):
    company = company_factory(hr_user)
    membership_factory(company, hr_user, MembershipRole.OWNER)
    member = user_factory(role=hr_user.role)

    added = client.post(
        f"/companies/{company.id}/members",
        headers=hr_headers,
        json={"user_id": str(member.id), "role": "recruiter"},
    )
    assert added.status_code == 201
    membership_id = added.json()["id"]

    listed = client.get(f"/companies/{company.id}/members", headers=hr_headers)
    assert listed.status_code == 200
    assert {item["user_id"] for item in listed.json()} == {str(hr_user.id), str(member.id)}

    updated = client.patch(
        f"/companies/member/{membership_id}/",
        headers=hr_headers,
        json={"role": "hr", "is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["is_active"] is False

    removed = client.delete(f"/companies/member/{membership_id}", headers=hr_headers)
    assert removed.status_code == 204


def test_job_publish_close_and_delete_endpoints(
    client, hr_headers, hr_user, hr_company, job_factory
):
    job = job_factory(hr_company, hr_user, status=JobStatus.DRAFT)

    published = client.post(f"/api/jobs/{job.id}/publish", headers=hr_headers)
    assert published.status_code == 200
    assert published.json()["status"] == "published"
    assert published.json()["published_at"] is not None

    closed = client.post(f"/api/jobs/{job.id}/close", headers=hr_headers)
    assert closed.status_code == 200
    assert closed.json()["status"] == "closed"

    deleted = client.delete(f"/api/jobs/{job.id}", headers=hr_headers)
    assert deleted.status_code == 204


def test_resume_list_get_and_default_endpoints(
    client, candidate_headers, candidate_user, resume_factory, db
):
    first = resume_factory(candidate_user)
    second = Resume(
        candidate_id=candidate_user.id,
        file_name="alternate.pdf",
        file_url="resumes/test/alternate.pdf",
        is_default=False,
    )
    db.add(second)
    db.flush()

    listed = client.get("/resumes/me", headers=candidate_headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 2
    assert all("file_url" not in item for item in listed.json())

    fetched = client.get(f"/resumes/{first.id}", headers=candidate_headers)
    assert fetched.status_code == 200

    made_default = client.patch(f"/resumes/{second.id}/default", headers=candidate_headers)
    assert made_default.status_code == 200
    assert made_default.json()["is_default"] is True


def test_application_list_and_user_role_probe(
    client,
    hr_headers,
    hr_user,
    hr_company,
    candidate_user,
    job_factory,
    application_factory,
):
    job = job_factory(hr_company, hr_user)
    application_factory(job, candidate_user)

    applications = client.get(f"/api/jobs/{job.id}/applications", headers=hr_headers)
    assert applications.status_code == 200
    assert applications.json()["total"] == 1

    role_probe = client.get("/users/hr-test", headers=hr_headers)
    assert role_probe.status_code == 200


def test_interview_get_list_update_cancel_no_show_and_feedback_get(
    client,
    hr_headers,
    hr_user,
    hr_company,
    candidate_user,
    job_factory,
    application_factory,
    interview_factory,
):
    job = job_factory(hr_company, hr_user)
    application = application_factory(job, candidate_user, status=ApplicationStatus.INTERVIEW)
    interview = interview_factory(application, hr_user)

    fetched = client.get(f"/interviews/{interview.id}", headers=hr_headers)
    assert fetched.status_code == 200
    listed = client.get(f"/interviews/applications/{application.id}", headers=hr_headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    rescheduled_at = datetime.now(timezone.utc) + timedelta(days=4)
    updated = client.patch(
        f"/interviews/{interview.id}",
        headers=hr_headers,
        json={"scheduled_at": rescheduled_at.isoformat(), "duration_minutes": 45},
    )
    assert updated.status_code == 200
    assert updated.json()["duration_minutes"] == 45

    cancelled = client.post(f"/interviews/{interview.id}/cancel", headers=hr_headers)
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    no_show_interview = interview_factory(application, hr_user, round_number=2)
    no_show = client.post(f"/interviews/{no_show_interview.id}/no-show", headers=hr_headers)
    assert no_show.status_code == 200
    assert no_show.json()["status"] == "no_show"

    completed = interview_factory(
        application, hr_user, round_number=3, status=InterviewStatus.COMPLETED
    )
    created_feedback = client.post(
        f"/interviews/{completed.id}/feedback",
        headers=hr_headers,
        json={"rating": 5, "recommendation": "strong_hire", "comments": "Excellent"},
    )
    assert created_feedback.status_code == 201
    feedback = client.get(f"/interviews/{completed.id}/feedback", headers=hr_headers)
    assert feedback.status_code == 200
    assert feedback.json()["rating"] == 5
