import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import User

if TYPE_CHECKING:
    from app.models.company_membership import CompanyMembership
    from app.models.job import Job
    from app.models.user import User

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CompanySize(str, Enum):
    STARTUP = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-1000"
    ENTERPRISE = "1001+"
    
class Industry(str, Enum):
    SOFTWARE = "software"
    FINTECH = "fintech"
    ECOMMERCE = "ecommerce"
    HEALTHCARE = "healthcare"
    EDTECH = "edtech"
    ENTERTAINMENT = "entertainment"
    GAMING = "gaming"
    CONSULTING = "consulting"
    MARKETING = "marketing"
    TELECOMMUNICATIONS = "telecommunications"
    AUTOMOTIVE = "automotive"
    LOGISTICS = "logistics"
    MANUFACTURING = "manufacturing"
    REAL_ESTATE = "real_estate"
    GOVERNMENT = "government"
    EDUCATION = "education"
    RETAIL = "retail"
    MEDIA = "media"
    TRAVEL = "travel"
    HOSPITALITY = "hospitality"
    OTHER = "other"
    
    
class Company(Base):
    __tablename__ = "companies"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    description: Mapped[str] =mapped_column(Text, nullable=False)
    website: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    logo_url: Mapped[str] = mapped_column(String(100))
    
    industry:Mapped[Industry] = mapped_column(SQLEnum(Industry, name="industry_name"), nullable=False)
    company_size: Mapped[CompanySize] = mapped_column(SQLEnum(CompanySize, name="company_size"), nullable=False)
    
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    owner: Mapped["User"] = relationship(back_populates="companies")
    jobs:Mapped[list["Job"]] = relationship(back_populates="company")
    memberships: Mapped[list["CompanyMembership"]] = relationship(back_populates="company")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)