import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.candidate_profile import (
    CandidateProfileCreate,
    CandidateProfileResponse,
    CandidateProfileUpdate,
)
from app.services import candidate_profile_service

router = APIRouter()

db_dependency = Depends(get_db)
user_dependency = Depends(get_current_active_user)


@router.post(
    "/me",
    response_model=CandidateProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_profile(
    payload: CandidateProfileCreate,
    db: Session = db_dependency,
    current_user: User = user_dependency,
):
    return candidate_profile_service.create_profile(
        db,
        payload,
        current_user,
    )


@router.get(
    "/me",
    response_model=CandidateProfileResponse,
)
def get_my_profile(
    db: Session = db_dependency,
    current_user: User = user_dependency,
):
    return candidate_profile_service.get_my_profile(
        db,
        current_user,
    )



@router.patch(
    "/me",
    response_model=CandidateProfileResponse,
)
def update_profile(
    payload: CandidateProfileUpdate,
    db: Session = db_dependency,
    current_user: User = user_dependency,
):
    return candidate_profile_service.update_profile(
        db,
        payload,
        current_user,
    )