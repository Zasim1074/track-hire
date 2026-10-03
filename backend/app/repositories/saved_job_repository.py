from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.saved_job import SavedJob
from app.models.job import Job


def list_by_candidate(db: Session, candidate_id: UUID) -> list[SavedJob]:
    stmt = select(SavedJob).options(joinedload(SavedJob.job).joinedload(Job.company)).where(SavedJob.candidate_id == candidate_id).order_by(SavedJob.created_at.desc())
    return list(db.scalars(stmt).unique())


def get(db: Session, candidate_id: UUID, job_id: UUID) -> SavedJob | None:
    return db.scalar(select(SavedJob).where(SavedJob.candidate_id == candidate_id, SavedJob.job_id == job_id))


def create(db: Session, saved_job: SavedJob) -> SavedJob:
    db.add(saved_job)
    db.commit()
    db.refresh(saved_job)
    return saved_job


def delete(db: Session, saved_job: SavedJob) -> None:
    db.delete(saved_job)
    db.commit()
