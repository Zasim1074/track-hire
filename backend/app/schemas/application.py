import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    resume_id: uuid.UUID
    cover_letter: str | None = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    recruiter_notes: str | None = None


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    candidate_id: uuid.UUID
    resume_id: uuid.UUID
    cover_letter: str | None
    status: ApplicationStatus
    recruiter_notes: str | None
    applied_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationListResponse(BaseModel):
    items: list[ApplicationResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
    

class ApplicationStatusHistoryResponse(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    from_status: ApplicationStatus | None
    to_status: ApplicationStatus
    changed_by: uuid.UUID
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
    
class ApplicationReject(BaseModel):
    reason: str | None = None