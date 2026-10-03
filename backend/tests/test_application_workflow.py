import pytest

from app.models.application import ApplicationStatus
from app.models.job import JobStatus


def test_duplicate_application_returns_conflict(
    client,
    candidate_headers,
    candidate_user,
    company,
    admin_user,
    job_factory,
    resume_factory,
):
    job = job_factory(company, admin_user)
    resume = resume_factory(candidate_user)
    payload = {"resume_id": str(resume.id), "cover_letter": "I am interested."}

    first_response = client.post(
        f"/api/jobs/{job.id}/applications",
        headers=candidate_headers,
        json=payload,
    )
    second_response = client.post(
        f"/api/jobs/{job.id}/applications",
        headers=candidate_headers,
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == (
        "You have already applied for this job."
    )


def test_candidate_can_withdraw_own_application(client, candidate_headers, candidate_user, company, admin_user, job_factory, application_factory):
    job = job_factory(company, admin_user)
    application = application_factory(job, candidate_user)

    response = client.post(
        f"/api/applications/{application.id}/withdraw",
        headers=candidate_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(application.id)
    assert response.json()["status"] == "withdrawn"


def test_candidate_cannot_withdraw_another_candidates_application(client, candidate_headers, user_factory, company, admin_user, job_factory, application_factory):
    owner = user_factory()
    job = job_factory(company, admin_user)
    application = application_factory(job, owner)

    response = client.post(
        f"/api/applications/{application.id}/withdraw",
        headers=candidate_headers,
    )

    assert response.status_code == 403


@pytest.mark.parametrize(
    ("job_status", "is_active"),
    [
        (JobStatus.CLOSED, True),
        (JobStatus.DRAFT, True),
        (JobStatus.PUBLISHED, False),
    ],
)
def test_application_to_non_accepting_job_returns_bad_request(
    client,
    candidate_headers,
    candidate_user,
    company,
    admin_user,
    job_factory,
    resume_factory,
    job_status,
    is_active,
):
    job = job_factory(
        company,
        admin_user,
        status=job_status,
        is_active=is_active,
    )
    resume = resume_factory(candidate_user)

    response = client.post(
        f"/api/jobs/{job.id}/applications",
        headers=candidate_headers,
        json={"resume_id": str(resume.id)},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "This job is not accepting applications."


def test_candidate_cannot_apply_with_another_users_resume(
    client,
    candidate_headers,
    user_factory,
    company,
    admin_user,
    job_factory,
    resume_factory,
):
    other_candidate = user_factory()
    job = job_factory(company, admin_user)
    resume = resume_factory(other_candidate)

    response = client.post(
        f"/api/jobs/{job.id}/applications",
        headers=candidate_headers,
        json={"resume_id": str(resume.id)},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You don't have enough permissions."


def test_resume_in_use_by_application_cannot_be_deleted(client, candidate_headers, candidate_user, company, admin_user, job_factory, resume_factory):
    job = job_factory(company, admin_user)
    resume = resume_factory(candidate_user)
    application = client.post(
        f"/api/jobs/{job.id}/applications",
        headers=candidate_headers,
        json={"resume_id": str(resume.id)},
    )
    assert application.status_code == 201

    response = client.delete(f"/resumes/{resume.id}", headers=candidate_headers)

    assert response.status_code == 409
    assert response.json()["detail"] == "Resume is attached to an application and cannot be deleted."


def test_invalid_application_status_transition_returns_bad_request(
    client,
    hr_headers,
    hr_company,
    hr_user,
    candidate_user,
    job_factory,
    application_factory,
):
    job = job_factory(hr_company, hr_user)
    application = application_factory(job, candidate_user)

    response = client.patch(
        f"/api/applications/{application.id}/status",
        headers=hr_headers,
        json={"status": "selected"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid application status transition."


def test_candidate_cannot_be_selected_before_all_interviews_are_complete(
    client,
    hr_headers,
    hr_company,
    hr_user,
    candidate_user,
    job_factory,
    application_factory,
    interview_factory,
):
    job = job_factory(hr_company, hr_user)
    application = application_factory(
        job,
        candidate_user,
        status=ApplicationStatus.INTERVIEW,
    )
    interview_factory(application, hr_user)

    response = client.post(
        f"/api/{application.id}/select",
        headers=hr_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "This application cannot be accepted or rejected in its current state."
    )


def test_rejected_application_cannot_be_rejected_again(
    client,
    hr_headers,
    hr_company,
    hr_user,
    candidate_user,
    job_factory,
    application_factory,
):
    job = job_factory(hr_company, hr_user)
    application = application_factory(
        job,
        candidate_user,
        status=ApplicationStatus.REJECTED,
    )

    response = client.post(
        f"/api/{application.id}/reject",
        headers=hr_headers,
        json={"reason": "Not a fit."},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid application status transition."
