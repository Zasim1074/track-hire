from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewUpdate,
)
from app.services import interview_service

router = APIRouter()
db_dependency = Depends(get_db)
user_dependency = Depends(get_current_active_user)


@router.post("/applications/{application_id}", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(application_id: UUID, payload: InterviewCreate, db: Session = db_dependency, current_user: User = user_dependency):
    return interview_service.create_interview(db, application_id, payload, current_user)


@router.get("/{interview_id}",response_model=InterviewResponse)
def get_interview(interview_id: UUID,db: Session = db_dependency,current_user: User = user_dependency):
    return interview_service.get_interview(db,interview_id,current_user)


@router.get("/applications/{application_id}",response_model=list[InterviewResponse])
def get_application_interviews(application_id: UUID,db: Session = db_dependency,current_user: User = user_dependency):
    return interview_service.get_application_interviews(db,application_id,current_user)


@router.patch("/{interview_id}",response_model=InterviewResponse)
def update_interview(interview_id: UUID,payload: InterviewUpdate,db: Session = db_dependency,current_user: User = user_dependency):
    return interview_service.update_interview(db,interview_id,payload,current_user)


@router.post("/{interview_id}/cancel",response_model=InterviewResponse)
def cancel_interview(interview_id: UUID,db: Session = db_dependency,current_user: User = user_dependency):
    return interview_service.cancel_interview(db,interview_id,current_user)


@router.post("/{interview_id}/complete",response_model=InterviewResponse)
def complete_interview(interview_id: UUID,db: Session = db_dependency,current_user: User = user_dependency):
    return interview_service.complete_interview(db,interview_id,current_user)
    
    
@router.post("/{interview_id}/no-show",response_model=InterviewResponse)
def no_show_interview(interview_id: UUID,db: Session = db_dependency,current_user: User = user_dependency):
    return interview_service.no_show_interview(db,interview_id,current_user)