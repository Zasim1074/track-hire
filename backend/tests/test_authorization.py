def test_candidate_can_list_own_applications(
    client,
    candidate_headers,
    candidate_user,
    company,
    admin_user,
    job_factory,
    application_factory,
):
    job = job_factory(company, admin_user)
    application = application_factory(job, candidate_user)

    response = client.get(
        "/api/applications/me",
        headers=candidate_headers,
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == str(application.id)


def test_candidate_cannot_access_hr_job_applications(
    client,
    candidate_headers,
    company,
    admin_user,
    job_factory,
):
    job = job_factory(company, admin_user)

    response = client.get(
        f"/api/jobs/{job.id}/applications",
        headers=candidate_headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You don't have enough permissions."


def test_candidate_cannot_access_another_users_resume(
    client,
    candidate_headers,
    user_factory,
    resume_factory,
):
    other_candidate = user_factory()
    resume = resume_factory(other_candidate)

    response = client.get(
        f"/resumes/{resume.id}",
        headers=candidate_headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You don't have enough permissions."


def test_admin_can_access_another_users_resume(
    client,
    admin_headers,
    user_factory,
    resume_factory,
):
    other_candidate = user_factory()
    resume = resume_factory(other_candidate)

    response = client.get(
        f"/resumes/{resume.id}",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(resume.id)


def test_hr_can_create_job_for_member_company(
    client,
    hr_headers,
    hr_company,
    hr_user,
):
    response = client.post(
        f"/api/companies/{hr_company.id}/jobs",
        headers=hr_headers,
        json={
            "title": "Backend Engineer",
            "description": "Build backend services.",
            "location": "Remote",
            "work_mode": "remote",
            "employment_type": "full_time",
            "experience_level": "entry",
            "min_experience": 0,
            "max_experience": 3,
            "skills": ["Python"],
            "status": "draft",
        },
    )

    assert response.status_code == 201
    assert response.json()["company_id"] == str(hr_company.id)
    assert response.json()["created_by"] == str(hr_user.id)


def test_hr_cannot_create_job_for_another_company(
    client,
    hr_headers,
    hr_company,
    admin_user,
    company_factory,
):
    other_company = company_factory(admin_user)
    assert other_company.id != hr_company.id

    response = client.post(
        f"/api/companies/{other_company.id}/jobs",
        headers=hr_headers,
        json={
            "title": "Backend Engineer",
            "description": "Build backend services.",
            "location": "Remote",
            "work_mode": "remote",
            "employment_type": "full_time",
            "experience_level": "entry",
            "min_experience": 0,
            "max_experience": 3,
            "skills": ["Python"],
            "status": "draft",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You don't have enough permissions."


def test_admin_can_read_interview_without_company_membership(
    client,
    admin_headers,
    candidate_user,
    hr_user,
    company_factory,
    membership_factory,
    job_factory,
    application_factory,
    interview_factory,
):
    company = company_factory(candidate_user)
    membership_factory(company, hr_user)
    job = job_factory(company, candidate_user)
    application = application_factory(job, candidate_user)
    interview = interview_factory(application, hr_user)

    response = client.get(
        f"/interviews/{interview.id}",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(interview.id)
