import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.company import CompanySize, Industry


class CompanyCreate(BaseModel):
    name: str
    description: str
    website: str
    location: str
    logo_url: str
    industry: str
    company_size: str


class CompanyUpdate(BaseModel):
    name: str
    description: str
    website: str
    location: str
    logo_url: str
    industry: Industry
    company_size: CompanySize


class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    website: str
    location: str
    logo_url: str
    industry: Industry
    company_size: CompanySize
    is_verified: bool
    is_active: bool
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyListResponse(BaseModel):
    items: list[CompanyResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
