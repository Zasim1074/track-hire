import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True,default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"),nullable=False)
    file_name: Mapped[str] = mapped_column(String(255),nullable=False)
    file_url: Mapped[str] = mapped_column(String(500),nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean,default=False,nullable=False)
    candidate: Mapped["User"] = relationship(back_populates="resumes")
    
    created_at: Mapped[datetime] = mapped_column(DateTime,default=utc_now,nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime,default=utc_now,onupdate=utc_now,nullable=False)