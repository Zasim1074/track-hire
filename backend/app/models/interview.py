import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.interview_feedback import InterviewFeedback
    from app.models.user import User


def get_utc() -> datetime:
    return datetime.now(timezone.utc)


class InterviewType(str, Enum):
    PHONE = "phone"
    VIDEO = "video"
    ONSITE = "onsite"
    TECHNICAL = "technical"
    HR = "hr"


class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Interview(Base):
    __tablename__ = "interviews"
    __table_args__ = (UniqueConstraint("application_id", "round_number", name="uq_interview_application_round"),)
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True,default=uuid.uuid4)
    status: Mapped[InterviewStatus] = mapped_column(SQLEnum(InterviewStatus, name="interview_status"), nullable=False, default=InterviewStatus.SCHEDULED)
    application_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("applications.id"),nullable=False)
    application: Mapped["Application"] = relationship(back_populates="interviews")
    
    interview_type: Mapped[InterviewType] = mapped_column(SQLEnum(InterviewType,name="interview_type"), nullable=False)
    interviewer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    interviewer: Mapped["User"] = relationship("User", foreign_keys=[interviewer_id],back_populates="interviews")
    
    scheduled_at: Mapped[datetime] = mapped_column(DateTime,nullable=False)
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer,nullable=False)
    notes: Mapped[str | None] = mapped_column(Text,nullable=True)
    feedback: Mapped["InterviewFeedback | None"] = relationship(back_populates="interview", uselist=False, cascade="all, delete-orphan")
    meeting_url: Mapped[str | None] = mapped_column(Text,nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=get_utc, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=get_utc, onupdate=get_utc, nullable=False)
