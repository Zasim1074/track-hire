from datetime import datetime, timedelta, timezone

from app.models.application import ApplicationStatus
from app.models.interview import InterviewStatus


def _interview_payload(interviewer_id, scheduled_at):
    return {
        "interviewer_id": str(interviewer_id),
        "scheduled_at": scheduled_at.isoformat(),
        "duration_minutes": 60,
        "meeting_url": "https://example.test/meeting",
        "interview_type": "video",
        "notes": "Technical screen",
    }


def test_interviewer_conflict_returns_conflict(
    client,
    hr_headers,
    hr_company,
    hr_user,
    candidate_user,
    user_factory,
    job_factory,
    application_factory,
):
    second_candidate = user_factory()
    job = job_factory(hr_company, hr_user)
    first_application = application_factory(
        job, candidate_user, status=ApplicationStatus.INTERVIEW
    )
    second_application = application_factory(
        job, second_candidate, status=ApplicationStatus.INTERVIEW
    )
    start_time = datetime.now(timezone.utc) + timedelta(days=3)
    first_response = client.post(
        f"/interviews/applications/{first_application.id}",
        headers=hr_headers,
        json=_interview_payload(hr_user.id, start_time),
    )
    assert first_response.status_code == 201

    conflict_response = client.post(
        f"/interviews/applications/{second_application.id}",
        headers=hr_headers,
        json=_interview_payload(
            hr_user.id,
            start_time + timedelta(minutes=30),
        ),
    )

    assert conflict_response.status_code == 409
    assert conflict_response.json()["detail"] == (
        "Interviewer already has an interview scheduled during this time."
    )


def test_hr_from_another_company_cannot_schedule_interview(
    client,
    hr_headers,
    hr_user,
    hr_company,
    admin_user,
    candidate_user,
    company_factory,
    job_factory,
    application_factory,
):
    other_company = company_factory(admin_user)
    job = job_factory(other_company, admin_user)
    application = application_factory(
        job, candidate_user, status=ApplicationStatus.INTERVIEW
    )

    response = client.post(
        f"/interviews/applications/{application.id}",
        headers=hr_headers,
        json=_interview_payload(
            hr_user.id,
            datetime.now(timezone.utc) + timedelta(days=3),
        ),
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You don't have enough permissions."


def test_feedback_can_only_be_submitted_once(
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
        job, candidate_user, status=ApplicationStatus.INTERVIEW
    )
    interview = interview_factory(
        application, hr_user, status=InterviewStatus.COMPLETED
    )
    payload = {"rating": 4, "recommendation": "hire", "comments": "Good interview."}

    first_response = client.post(
        f"/interviews/{interview.id}/feedback",
        headers=hr_headers,
        json=payload,
    )
    second_response = client.post(
        f"/interviews/{interview.id}/feedback",
        headers=hr_headers,
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == (
        "Feedback already exists for this interview."
    )


def test_feedback_before_interview_completion_is_forbidden(
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
        job, candidate_user, status=ApplicationStatus.INTERVIEW
    )
    interview = interview_factory(application, hr_user)

    response = client.post(
        f"/interviews/{interview.id}/feedback",
        headers=hr_headers,
        json={"rating": 4, "recommendation": "hire"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "You are not allowed to access or submit this feedback."
    )


def test_completed_interview_cannot_transition_again(
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
        job, candidate_user, status=ApplicationStatus.INTERVIEW
    )
    interview = interview_factory(application, hr_user)

    complete_response = client.post(
        f"/interviews/{interview.id}/complete",
        headers=hr_headers,
    )
    second_complete_response = client.post(
        f"/interviews/{interview.id}/complete",
        headers=hr_headers,
    )

    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "completed"
    assert second_complete_response.status_code == 400
    assert second_complete_response.json()["detail"] == (
        "Invalid interview status transition."
    )
