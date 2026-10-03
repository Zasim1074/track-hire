import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CandidateProfileCreate(BaseModel):
    phone: str | None = None
    headline: str | None = None
    bio: str | None = None
    location: str | None = None
    experience_years: int | None = Field(default=None, ge=0)
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None


class CandidateProfileUpdate(BaseModel):
    phone: str | None = None
    headline: str | None = None
    bio: str | None = None
    location: str | None = None
    experience_years: int | None = Field(default=None, ge=0)
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None


class CandidateProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID

    phone: str | None
    headline: str | None
    bio: str | None
    location: str | None
    experience_years: int | None

    linkedin_url: str | None
    github_url: str | None
    portfolio_url: str | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
