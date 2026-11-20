from uuid import UUID

from pydantic import BaseModel, Field


class AtsResumeSummary(BaseModel):
    id: UUID
    file_name: str


class AtsScoreResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    label: str
    matched_skills: list[str]
    missing_skills: list[str]
    matched_keywords: list[str]
    recommendations: list[str]
    resume: AtsResumeSummary

