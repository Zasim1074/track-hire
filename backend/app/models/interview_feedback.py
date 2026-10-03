import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.interview import Interview
    from app.models.user import User


def get_utc() -> datetime:
    return datetime.now(timezone.utc)


class Recommendation(str, Enum):
    STRONG_HIRE = "strong_hire"
    HIRE = "hire"
    NO_HIRE = "no_hire"
    STRONG_NO_HIRE = "strong_no_hire"


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True,default=uuid.uuid4)
    interview_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interviews.id"), nullable=False,unique=True)
    interviewer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"),nullable=False)
    rating: Mapped[int] = mapped_column(Integer,nullable=False)
    recommendation: Mapped[Recommendation] = mapped_column(SQLEnum(Recommendation, name="feedback_recommendation"), nullable=False)
    strengths: Mapped[str | None] = mapped_column(Text,nullable=True)
    weaknesses: Mapped[str | None] = mapped_column(Text,nullable=True)
    comments: Mapped[str | None] = mapped_column(Text,nullable=True)
    
    interview: Mapped["Interview"] = relationship(back_populates="feedback")
    interviewer: Mapped["User"] = relationship(back_populates="interview_feedback")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=get_utc, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=get_utc, onupdate=get_utc, nullable=False)
