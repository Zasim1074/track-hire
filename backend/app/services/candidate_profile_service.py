import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import (CandidateProfileAlreadyExistsError, CandidateProfileNotFoundError, ForbiddenError,)
from app.models.candidate_profile import CandidateProfile
from app.models.user import User, UserRole
from app.repositories.candidate_profile_repository import (
    create,
    get_by_user_id,
)
from app.schemas.candidate_profile import (
    CandidateProfileCreate,
    CandidateProfileResponse,
    CandidateProfileUpdate,
)


def create_profile(
    db: Session,
    payload: CandidateProfileCreate,
    current_user: User,
) -> CandidateProfileResponse:

    if current_user.role != UserRole.CANDIDATE:
        raise ForbiddenError

    existing = get_by_user_id(
        db,
        current_user.id,
    )

    if existing is not None:
        raise CandidateProfileAlreadyExistsError

    profile = CandidateProfile(
        user_id=current_user.id,
        **payload.model_dump(),
    )

    created = create(db, profile)

    return CandidateProfileResponse.model_validate(created)


def get_my_profile(
    db: Session,
    current_user: User,
) -> CandidateProfileResponse:

    if current_user.role != UserRole.CANDIDATE:
        raise ForbiddenError

    profile = get_by_user_id(
        db,
        current_user.id,
    )

    if profile is None:
        raise CandidateProfileNotFoundError

    return CandidateProfileResponse.model_validate(profile)


def update_profile(
    db: Session,
    payload: CandidateProfileUpdate,
    current_user: User,
) -> CandidateProfileResponse:

    if current_user.role != UserRole.CANDIDATE:
        raise ForbiddenError

    profile = get_by_user_id(
        db,
        current_user.id,
    )

    if profile is None:
        raise CandidateProfileNotFoundError

    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return CandidateProfileResponse.model_validate(profile)