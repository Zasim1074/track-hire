import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.job import EmploymentType, ExperienceLevel, JobStatus, WorkMode


class JobCreate(BaseModel):
    title: str
    description: str
    location: str | None = None
    work_mode: WorkMode
    employment_type: EmploymentType
    experience_level: ExperienceLevel
    min_experience: int = Field(0, ge=0)
    max_experience: int | None = Field(None, ge=0)
    min_salary: int | None = Field(None, ge=0)
    max_salary: int | None = Field(None, ge=0)
    skills: list[str]
    status: JobStatus
    application_deadline: datetime | None = None

    @model_validator(mode="after")
    def validate_ranges(self):
        if self.max_experience is not None and self.max_experience < self.min_experience:
            raise ValueError("Maximum experience must be at least the minimum experience.")
        if self.min_salary is not None and self.max_salary is not None and self.max_salary < self.min_salary:
            raise ValueError("Maximum salary must be at least the minimum salary.")
        return self


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

    @model_validator(mode="after")
    def validate_ranges(self):
        if self.min_experience is not None and self.max_experience is not None and self.max_experience < self.min_experience:
            raise ValueError("Maximum experience must be at least the minimum experience.")
        if self.min_salary is not None and self.max_salary is not None and self.max_salary < self.min_salary:
            raise ValueError("Maximum salary must be at least the minimum salary.")
        return self


class JobCompanySummary(BaseModel):
    name: str
    logo_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


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
    published_at: datetime | None
    status: JobStatus
    is_active: bool

    company_id: uuid.UUID
    company: JobCompanySummary | None = None
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
