import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.interview import InterviewStatus, InterviewType


@field_validator("scheduled_at")
@classmethod
def validate_scheduled_at(cls, value: datetime) -> datetime:

    if value.tzinfo is None:
        raise ValueError("scheduled_at must include timezone information")

    if value <= datetime.now(timezone.utc):
        raise ValueError("Interview must be scheduled in the future")

    return value


class InterviewCreate(BaseModel):
    interviewer_id: uuid.UUID
    scheduled_at: datetime
    duration_minutes: int = Field(
        gt=0,
        le=480,
    )
    meeting_url: str | None = None
    interview_type: InterviewType
    notes: str | None = None


class InterviewUpdate(BaseModel):
    interviewer_id: uuid.UUID | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(
        default=None,
        gt=0,
        le=480,
    )
    meeting_url: str | None = None
    interview_type: InterviewType | None = None
    notes: str | None = None


class InterviewResponse(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    interviewer_id: uuid.UUID
    scheduled_at: datetime
    duration_minutes: int
    meeting_url: str | None
    interview_type: InterviewType
    status: InterviewStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
