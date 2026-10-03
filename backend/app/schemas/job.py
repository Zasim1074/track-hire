import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.job import EmploymentType, ExperienceLevel, JobStatus, WorkMode


class JobCreate(BaseModel):
    title: str
    description: str
    location: str | None = None
    work_mode: WorkMode
    employment_type: EmploymentType
    experience_level: ExperienceLevel
    min_experience: int = 0
    max_experience: int | None = None
    min_salary: int | None = None
    max_salary: int | None = None
    skills: list[str]
    status: JobStatus
    application_deadline: datetime | None = None


class JobUpdate(BaseModel):
    title: str
    description: str
    location: str 
    work_mode: WorkMode 
    employment_type: EmploymentType 
    experience_level: ExperienceLevel 
    min_experience: int | None = None
    max_experience: int | None = None
    min_salary: int | None = None
    max_salary: int | None = None
    skills: list[str]
    application_deadline: datetime | None = None
    status: JobStatus
    is_active: bool


class JobResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    location: str | None
    work_mode: WorkMode
    employment_type: EmploymentType
    experience_level: ExperienceLevel
    min_experience: int | None
    max_experience: int | None
    min_salary: int | None
    max_salary: int | None
    skills: list[str]
    application_deadline: datetime | None
    status: JobStatus
    is_active: bool

    company_id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    items: list[JobResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
