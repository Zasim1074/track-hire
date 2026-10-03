import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.interview_feedback import Recommendation


class InterviewFeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    recommendation: Recommendation
    strengths: str | None = None
    weaknesses: str | None = None
    comments: str | None = None


class InterviewFeedbackResponse(BaseModel):
    id: uuid.UUID
    interview_id: uuid.UUID
    interviewer_id: uuid.UUID
    rating: int
    recommendation: Recommendation
    strengths: str | None
    weaknesses: str | None
    comments: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)