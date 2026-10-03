from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus
from app.models.application_history import ApplicationStatusHistory


def create(db: Session, application: Application) -> Application:
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def update_application(db: Session, application: Application) -> Application:
    db.commit()
    db.refresh(application)
    return application


def get_by_id(db: Session, application_id: UUID) -> Application | None:
    stmt = select(Application).where(Application.id == application_id)
    return db.scalar(stmt)


def get_by_job_and_candidate(db: Session, job_id: UUID, candidate_id: UUID) -> Application | None:
    stmt = select(Application).where(Application.job_id == job_id and Application.candidate_id == candidate_id)
    return db.scalar(stmt)


def get_by_candidate_id(
    db: Session,
    candidate_id: UUID,
    page: int,
    page_size: int,
    application_status: ApplicationStatus | None = None,
) -> tuple[list[Application], int]:
    filters = [Application.candidate_id == candidate_id]

    if application_status is not None:
        filters.append(Application.status == application_status)

    count_stmt = select(func.count()).select_from(Application).where(*filters)
    total = db.scalar(count_stmt) or 0
    offset = (page - 1) * page_size

    stmt = (
        select(Application)
        .where(*filters)
        .order_by(Application.applied_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    Applications = list(db.scalars(stmt))

    return Applications, total


def get_by_job_id(
    db: Session,
    job_id: UUID,
    page: int,
    page_size: int,
    application_status: ApplicationStatus | None = None,
) -> tuple[list[Application], int]:
    filters = [Application.job_id == job_id]
    
    if application_status is not None:
        filters.append(Application.status == application_status)
    
    count_stmt = select(func.count()).select_from(Application).where(*filters)
    total = db.scalar(count_stmt) or 0
    offset = (page - 1) * page_size
    
    stmt = (
        select(Application)
        .where(*filters)
        .order_by(Application.applied_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    
    applications = list(db.scalars(stmt))
    return applications, total


def get_by_application_id(db: Session, application_id: UUID) -> list[ApplicationStatusHistory]:
    stmt = (
        select(ApplicationStatusHistory)
        .where(ApplicationStatusHistory.application_id == application_id)
        .order_by(ApplicationStatusHistory.created_at.asc())
    )

    return list(db.scalars(stmt))