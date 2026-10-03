from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.job import EmploymentType, ExperienceLevel, Job, JobStatus, WorkMode


def create(db: Session, job: Job) -> Job:
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job(db: Session, job: Job) -> Job:
    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, job: Job) -> None:
    db.delete(job)
    db.commit()


def get_job_by_id(db: Session, job_id: UUID) -> Job | None:
    stmt = select(Job).where(Job.id == job_id)
    return db.scalar(stmt)

def get_job_by_company_id(db: Session, copmany_id: UUID) -> list[Job]:
    stmt = select(Job).where(Job.company_id == copmany_id)
    return list(db.scalars(stmt))


def get_jobs(
    db: Session,
    page: int,
    page_size: int,
    search: str | None,
    status: JobStatus | None,
    work_mode: WorkMode | None,
    employment_type: EmploymentType | None,
    experience_level: ExperienceLevel | None,
) -> tuple[list[Job], int]:

    stmt = select(Job).where(Job.is_active.is_(True))

    if status is not None:
        stmt = stmt.where(Job.status == status)
    else:
        stmt = stmt.where(Job.status == "PUBLISHED")

    if search is not None:
        stmt = stmt.where(Job.title.ilike(f"%{search}%"))

    if work_mode is not None:
        stmt = stmt.where(Job.work_mode == work_mode)

    if employment_type is not None:
        stmt = stmt.where(Job.employment_type == employment_type)

    if experience_level is not None:
        stmt = stmt.where(Job.experience_level == experience_level)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    if page and page_size is not None:
        offset = (page - 1) * page_size
        stmt = stmt.limit(page_size).offset(offset)

    stmt = stmt.order_by(Job.created_at.desc())
    jobs = list(db.scalars(stmt))

    return jobs, total
