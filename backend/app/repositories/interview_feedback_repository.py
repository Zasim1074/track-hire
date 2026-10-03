import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.interview_feedback import InterviewFeedback


def create(db: Session, feedback: InterviewFeedback ) -> InterviewFeedback:
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return feedback


def get_by_interview_id(db: Session, interview_id: uuid.UUID) -> InterviewFeedback | None:
    stmt = select(InterviewFeedback).where(InterviewFeedback.interview_id == interview_id)

    return db.scalar(stmt)