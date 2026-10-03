from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.interview import Interview, InterviewStatus


def as_utc_naive(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def create(
    db: Session,
    interview: Interview,
) -> Interview:
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


def get_by_id(db: Session, interview_id: UUID) -> Interview | None:
    stmt = select(Interview).where(Interview.id == interview_id)
    return db.scalar(stmt)


def get_by_application_id(db: Session, application_id: UUID) -> list[Interview]:
    stmt = (
        select(Interview)
        .where(Interview.application_id == application_id)
        .order_by(Interview.scheduled_at.asc())
    )
    return list(db.scalars(stmt))


def has_conflict(
    db: Session,
    interviewer_id: UUID,
    scheduled_at: datetime,
    duration_minutes: int,
    exclude_interview_id: UUID | None = None,
) -> bool:
    stmt = select(Interview).where(
        Interview.interviewer_id == interviewer_id,
        Interview.status == InterviewStatus.SCHEDULED,
    )

    if exclude_interview_id:
        stmt = stmt.where(Interview.id != exclude_interview_id)

    interviews = list(db.scalars(stmt))

    new_start = as_utc_naive(scheduled_at)
    new_end = new_start + timedelta(minutes=duration_minutes)

    for interview in interviews:
        existing_start = as_utc_naive(interview.scheduled_at)

        existing_end = existing_start + timedelta(minutes=interview.duration_minutes)

        if new_start < existing_end and new_end > existing_start:
            return True

    return False


def get_next_round_number(db: Session, application_id: UUID) -> int:
    stmt = select(func.max(Interview.round_number)).where(
        Interview.application_id == application_id
    )
    last_round = db.scalar(stmt)

    if last_round is None:
        return 1

    return last_round + 1


def get_latest_interview(db: Session, application_id: UUID) -> Interview | None:
    stmt = (
        select(Interview)
        .where(Interview.application_id == application_id)
        .order_by(Interview.round_number.desc())
        .limit(1)
    )
    return db.scalar(stmt)
