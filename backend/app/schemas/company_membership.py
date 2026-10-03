import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.company_membership import MembershipRole


class MembershipCreate(BaseModel):
    user_id: uuid.UUID
    role: MembershipRole


class MembershipUpdate(BaseModel):
    role: MembershipRole
    is_active: bool


class MembershipResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    user_id: uuid.UUID
    role: MembershipRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
