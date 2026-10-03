import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.application_history import ApplicationStatusHistory
    from app.models.interview import Interview
    from app.models.job import Job
    from app.models.resume import Resume
    from app.models.user import User


def get_utc() -> datetime:
    return datetime.now(timezone.utc)


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    SELECTED = "selected"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Application(Base):
    __tablename__ = "applications"

    __table_args__ = (
        UniqueConstraint(
            "job_id",
            "candidate_id",
            name="un_application_job_candidate",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True,default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id"),nullable=False)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"),nullable=False)
    resume_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resumes.id"),nullable=False)
    cover_letter: Mapped[str | None] = mapped_column(Text,nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(SQLEnum(ApplicationStatus,name="application_status",),nullable=False,default=ApplicationStatus.APPLIED)
    recruiter_notes: Mapped[str | None] = mapped_column(Text,nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text,nullable=True)
    job: Mapped["Job"] = relationship(back_populates="applications")
    candidate: Mapped["User"] = relationship(back_populates="applications")
    resume: Mapped["Resume"] = relationship()
    status_history: Mapped[list["ApplicationStatusHistory"]] = relationship(cascade="all, delete-orphan", order_by="ApplicationStatusHistory.created_at")
    interviews: Mapped[list["Interview"]] = relationship(back_populates="application",cascade="all, delete-orphan")
    
    applied_at: Mapped[datetime] = mapped_column(DateTime, default=get_utc, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=get_utc, onupdate=get_utc, nullable=False)