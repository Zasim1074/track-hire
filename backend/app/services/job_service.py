import math
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.dependencies import require_company_membership
from app.core.exceptions import (
    CompanyMembershipRequiredError,
    CompanyNotFoundError,
    ForbiddenError,
    JobNotFoundError,
    ForbiddenError,
)
from app.models.job import EmploymentType, ExperienceLevel, Job, JobStatus, WorkMode
from app.models.user import User
from app.repositories.company_repository import get_company_by_id, get_primary_company_for_user
from app.repositories.job_repository import create, get_job_by_id
from app.repositories.job_repository import delete_job as repo_delete_job
from app.repositories.job_repository import get_jobs as repo_get_jobs
from app.repositories.job_repository import get_jobs_for_user as repo_get_jobs_for_user
from app.repositories.job_repository import update_job as repo_update_job
from app.schemas.job import JobCreate, JobListResponse, JobResponse, JobUpdate


def create_job(
    db: Session, company_id: UUID, current_user: User, payload: JobCreate
) -> JobResponse:
    company = get_company_by_id(db, company_id)

    if company is None:
        raise CompanyNotFoundError

    require_company_membership(db, company.id, current_user)

    job = Job(
        title=payload.title,
        description=payload.description,
        location=payload.location,
        work_mode=payload.work_mode,
        employment_type=payload.employment_type,
        experience_level=payload.experience_level,
        min_experience=payload.min_experience,
        max_experience=payload.max_experience,
        min_salary=payload.min_salary,
        max_salary=payload.max_salary,
        skills=payload.skills,
        application_deadline=payload.application_deadline,
        status=payload.status,
        company_id=company.id,
        created_by=current_user.id,
    )

    created_job = create(db, job)
    return JobResponse.model_validate(created_job)


def create_job_for_user(db: Session, current_user: User, payload: JobCreate) -> JobResponse:
    company = get_primary_company_for_user(db, current_user)
    if company is None:
        raise CompanyMembershipRequiredError
    return create_job(db, company.id, current_user, payload)


def get_jobs(
    db: Session,
    page: int,
    page_size: int,
    search: str | None,
    status: JobStatus | None,
    work_mode: WorkMode | None,
    employment_type: EmploymentType | None,
    experience_level: ExperienceLevel | None,
) -> JobListResponse:

    jobs, total = repo_get_jobs(
        db,
        page,
        page_size,
        search,
        status,
        work_mode,
        employment_type,
        experience_level,
    )
    total_pages = math.ceil(total / page_size) if total else 0

    return JobListResponse(
        items=[JobResponse.model_validate(job) for job in jobs],
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        total=total,
    )


def get_job(db: Session, job_id: UUID, current_user: User | None = None) -> JobListResponse:
    job = get_job_by_id(db, job_id)

    if job is None or not job.is_active:
        raise JobNotFoundError

    if job.status != JobStatus.PUBLISHED:
        if current_user is None:
            raise JobNotFoundError
        try:
            require_company_membership(db, job.company_id, current_user)
        except ForbiddenError:
            raise JobNotFoundError
    return JobResponse.model_validate(job)


def get_my_jobs(db: Session, current_user: User, page: int, page_size: int) -> JobListResponse:
    jobs, total = repo_get_jobs_for_user(db, current_user, page, page_size)
    return JobListResponse(
        items=[JobResponse.model_validate(job) for job in jobs],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


def update_job(
    db: Session, job_id: UUID, payload: JobUpdate, current_user: User
) -> JobResponse:
    job = get_job_by_id(db, job_id)

    if job is None:
        raise JobNotFoundError

    require_company_membership(db, job.company_id, current_user)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, field, value)

    updated_job = repo_update_job(db, job)
    return JobResponse.model_validate(updated_job)


def delete_job(db: Session, job_id: UUID, current_user: User) -> None:
    job = get_job_by_id(db, job_id)

    if job is None:
        raise JobNotFoundError

    membership = require_company_membership(db, job.company_id, current_user)
    if membership is None:
        raise ForbiddenError

    repo_delete_job(db, job)


def publish_job(db: Session, job_id: UUID, current_user: User) -> JobResponse:
    job = get_job_by_id(db, job_id)

    if job is None:
        raise JobNotFoundError

    membership = require_company_membership(db, job.company_id, current_user)
    if membership is None:
        raise ForbiddenError

    job.status = JobStatus.PUBLISHED
    published_job = repo_update_job(db, job)

    return JobResponse.model_validate(published_job)


def close_job(db: Session, job_id: UUID, current_user: User) -> JobResponse:
    job = get_job_by_id(db, job_id)

    if job is None:
        raise JobNotFoundError

    membership = require_company_membership(db, job.company_id, current_user)
    if membership is None:
        raise ForbiddenError

    job.status = JobStatus.CLOSED
    closed_job = repo_update_job(db, job)

    return JobResponse.model_validate(closed_job)
