import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.company import Company
    from app.models.user import User

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


class WorkMode(str, Enum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"


class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"


class JobStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        CheckConstraint("min_experience >= 0", name="ck_jobs_min_experience_nonnegative"),
        CheckConstraint("max_experience IS NULL OR max_experience >= min_experience", name="ck_jobs_experience_range"),
        CheckConstraint("min_salary IS NULL OR min_salary >= 0", name="ck_jobs_min_salary_nonnegative"),
        CheckConstraint("max_salary IS NULL OR max_salary >= 0", name="ck_jobs_max_salary_nonnegative"),
        CheckConstraint("min_salary IS NULL OR max_salary IS NULL OR max_salary >= min_salary", name="ck_jobs_salary_range"),
        Index("ix_jobs_public_listing", "status", "is_active", "created_at"),
        Index("ix_jobs_company_status", "company_id", "status"),
    )
    
    id : Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    work_mode: Mapped[WorkMode] = mapped_column(SQLEnum(WorkMode, name="work_mode"), nullable=False)
    
    employment_type:Mapped[EmploymentType] = mapped_column(SQLEnum(EmploymentType, name="employment_type"), nullable=False)
    experience_level: Mapped[ExperienceLevel] = mapped_column(SQLEnum(ExperienceLevel, name="experience_level"), nullable=False)
    min_experience: Mapped[int | None] = mapped_column(Integer, nullable=False)
    max_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_salary: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_salary: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    application_deadline:Mapped[datetime | None]= mapped_column(DateTime, default=None, nullable=True)
    status:Mapped[JobStatus] = mapped_column(SQLEnum(JobStatus, name="status"), default=JobStatus.DRAFT, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False)
    company: Mapped["Company"] = relationship(back_populates="jobs")
    
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    creator:Mapped["User"] = relationship(back_populates="jobs")
    applications: Mapped[list["Application"]] = relationship(back_populates="job")
    
    created_at:Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at:Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
