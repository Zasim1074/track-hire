import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.application import ApplicationStatus

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.user import User


def get_utc() -> datetime:
    return datetime.now(timezone.utc)


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True,default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("applications.id"),nullable=False)
    from_status: Mapped[ApplicationStatus | None] = mapped_column(SQLEnum(ApplicationStatus,name="application_status",),nullable=True)
    to_status: Mapped[ApplicationStatus] = mapped_column(SQLEnum(ApplicationStatus,name="application_status",),nullable=False)
    changed_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"),nullable=False)
    notes: Mapped[str | None] = mapped_column(Text,nullable=True)
    
    application: Mapped["Application"] = relationship()
    user: Mapped["User"] = relationship()
    
    created_at: Mapped[datetime] = mapped_column(DateTime,default=get_utc,nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=get_utc, onupdate=get_utc, nullable=False)