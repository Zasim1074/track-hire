from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.saved_job import SavedJobResponse
from app.services import saved_job_service

router = APIRouter()


@router.get("/", response_model=list[SavedJobResponse], dependencies=[Depends(require_roles(UserRole.CANDIDATE))])
def list_saved_jobs(db: Session = Depends(get_db), user: User = Depends(get_current_active_user)):
    return saved_job_service.list_saved_jobs(db, user)


@router.post("/{job_id}", response_model=SavedJobResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(UserRole.CANDIDATE))])
def save_job(job_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_active_user)):
    return saved_job_service.save_job(db, job_id, user)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles(UserRole.CANDIDATE))])
def remove_saved_job(job_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_active_user)):
    saved_job_service.remove_saved_job(db, job_id, user)
