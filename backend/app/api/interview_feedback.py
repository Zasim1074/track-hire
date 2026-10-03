from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.interview_feedback import (
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
)
from app.services import interview_feedback_service

router = APIRouter()

db_dependency = Depends(get_db)
user_dependency = Depends(get_current_active_user)


@router.post(
    "/{interview_id}/feedback",
    response_model=InterviewFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_feedback(
    interview_id: UUID,
    payload: InterviewFeedbackCreate,
    db: Session = db_dependency,
    current_user: User = user_dependency,
):
    return interview_feedback_service.create_feedback(
        db,
        interview_id,
        payload,
        current_user,
    )
    
    
    
@router.get(
    "/{interview_id}/feedback",
    response_model=InterviewFeedbackResponse,
)
def get_feedback(
    interview_id: UUID,
    db: Session = db_dependency,
    current_user: User = user_dependency,
):
    return interview_feedback_service.get_feedback(
        db,
        interview_id,
        current_user,
    )