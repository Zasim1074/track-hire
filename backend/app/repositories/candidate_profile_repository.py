import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.candidate_profile import CandidateProfile


def create(db: Session, profile: CandidateProfile ) -> CandidateProfile:
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_by_user_id(db: Session, user_id: uuid.UUID) -> CandidateProfile | None:
    stmt = select(CandidateProfile).where(CandidateProfile.user_id == user_id)
    return db.scalar(stmt)
