from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.resume import ResumeResponse
from app.services import resume_service

router = APIRouter()

db_dependency = Depends(get_db)
user_dependency = Depends(get_current_active_user)
file_dependency = File(...)


@router.get("/me")
def get_my_resumes(db: Session = db_dependency, current_user: User = user_dependency):
    return resume_service.get_my_resumes(db, current_user)
    
    
@router.get("/{resume_id}")
def get_resume(resume_id: UUID, db: Session = db_dependency, current_user: User = user_dependency):
    return resume_service.get_resume(db, resume_id, current_user)


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(file: UploadFile = file_dependency, db: Session = db_dependency, current_user: User = user_dependency):
    return await resume_service.upload_resume(db, file, current_user)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT,)
def delete_resume(resume_id: UUID, db: Session = db_dependency, current_user: User = user_dependency):
    resume_service.delete_resume(db, resume_id, current_user)
    
    
@router.patch("/{resume_id}/default", response_model=ResumeResponse)
def set_default_resume(resume_id: UUID, db: Session = db_dependency, current_user: User = user_dependency):
    return resume_service.set_default_resume(db, resume_id, current_user)