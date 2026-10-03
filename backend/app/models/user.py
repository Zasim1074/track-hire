import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.candidate_profile import CandidateProfile
    from app.models.company import Company
    from app.models.company_membership import CompanyMembership
    from app.models.interview import Interview
    from app.models.interview_feedback import InterviewFeedback
    from app.models.job import Job
    from app.models.resume import Resume

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    ADMIN = "admin"
    CANDIDATE = "candidate"
    HR = "hr"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole, name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    candidate_profile: Mapped["CandidateProfile | None"] = relationship( back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    resumes: Mapped[list["Resume"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship(back_populates="candidate")
    jobs: Mapped[list["Job"]] = relationship(back_populates="creator")
    
    companies: Mapped[list["Company"]] = relationship(back_populates="owner")
    company_memberships: Mapped[list["CompanyMembership"]] = relationship(back_populates="user")
    
    interviews: Mapped[list["Interview"]] = relationship( "Interview", foreign_keys="Interview.interviewer_id", back_populates="interviewer")
    interview_feedback: Mapped[list["InterviewFeedback"]] = relationship()
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)