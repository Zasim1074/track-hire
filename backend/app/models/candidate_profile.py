import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True,nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20),nullable=True,)
    headline: Mapped[str | None] = mapped_column(String(255),nullable=True,)
    bio: Mapped[str | None] = mapped_column(Text,nullable=True,)
    location: Mapped[str | None] = mapped_column(String(200),nullable=True,)
    experience_years: Mapped[int | None] = mapped_column(nullable=True,)
    linkedin_url: Mapped[str | None] = mapped_column(String(500),nullable=True,)
    github_url: Mapped[str | None] = mapped_column(String(500),nullable=True,)
    portfolio_url: Mapped[str | None] = mapped_column(String(500),nullable=True,)
    user: Mapped["User"] = relationship(back_populates="candidate_profile")
    created_at: Mapped[datetime] = mapped_column(DateTime,default=utc_now,nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime,default=utc_now,onupdate=utc_now,nullable=False,)