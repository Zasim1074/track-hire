from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.job import EmploymentType, ExperienceLevel, Job, JobStatus, WorkMode
from app.models.company import Company
from app.models.company_membership import CompanyMembership, MembershipRole
from app.models.user import User, UserRole


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


def get_jobs_for_user(db: Session, user: User, page: int, page_size: int) -> tuple[list[Job], int]:
    stmt = select(Job).join(Company, Job.company_id == Company.id).outerjoin(
        CompanyMembership,
        (CompanyMembership.company_id == Job.company_id)
        & (CompanyMembership.user_id == user.id)
        & CompanyMembership.is_active.is_(True),
    )
    if user.role != UserRole.ADMIN:
        stmt = stmt.where(or_(Company.owner_id == user.id, CompanyMembership.role.in_([
            MembershipRole.OWNER, MembershipRole.HR, MembershipRole.RECRUITER,
        ])))
    ids = stmt.with_only_columns(Job.id, Job.created_at).distinct().order_by(Job.created_at.desc())
    count_query = select(func.count()).select_from(ids.subquery())
    count = db.scalar(count_query) or 0
    page_ids = ids.limit(page_size).offset((page - 1) * page_size).subquery()
    jobs = list(db.scalars(select(Job).where(Job.id.in_(select(page_ids.c.id))).order_by(Job.created_at.desc())))
    return jobs, count


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

    # The public listing must never expose drafts or closed jobs, even when a
    # caller supplies a different status query parameter.
    stmt = stmt.where(Job.status == JobStatus.PUBLISHED)

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
