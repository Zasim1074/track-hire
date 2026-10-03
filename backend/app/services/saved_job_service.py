from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.job import JobStatus
from app.models.saved_job import SavedJob
from app.models.user import User
from app.repositories.job_repository import get_job_by_id
from app.repositories import saved_job_repository
from app.schemas.saved_job import SavedJobResponse


def list_saved_jobs(db: Session, user: User) -> list[SavedJobResponse]:
    return [SavedJobResponse.model_validate(item) for item in saved_job_repository.list_by_candidate(db, user.id)]


def save_job(db: Session, job_id: UUID, user: User) -> SavedJobResponse:
    job = get_job_by_id(db, job_id)
    if job is None or job.status != JobStatus.PUBLISHED or not job.is_active:
        raise HTTPException(status_code=404, detail="Published job not found")
    existing = saved_job_repository.get(db, user.id, job_id)
    if existing is not None:
        return SavedJobResponse.model_validate(existing)
    saved = saved_job_repository.create(db, SavedJob(candidate_id=user.id, job_id=job_id))
    return SavedJobResponse.model_validate(saved)


def remove_saved_job(db: Session, job_id: UUID, user: User) -> None:
    saved = saved_job_repository.get(db, user.id, job_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="Saved job not found")
    saved_job_repository.delete(db, saved)
