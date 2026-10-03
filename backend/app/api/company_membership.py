from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db, require_roles
from app.models.company_membership import MembershipRole
from app.models.user import User, UserRole
from app.schemas.company_membership import (
    MembershipCreate,
    MembershipResponse,
    MembershipUpdate,
)
from app.services import company_membership_service

router = APIRouter()
db_dependency = Depends(get_db)
user_dependency = Depends(get_current_active_user)
hr_admin_dependency = Depends(require_roles(UserRole.ADMIN, MembershipRole.HR, MembershipRole.RECRUITER, MembershipRole.OWNER))


@router.post("/{company_id}/members", dependencies=[hr_admin_dependency], response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
def add_member(company_id: UUID, payload: MembershipCreate, db: Session = db_dependency, current_user: User = user_dependency):
    return company_membership_service.add_member(db, company_id, payload, current_user)


@router.get("/{company_id}/members", dependencies=[hr_admin_dependency], response_model=list[MembershipResponse], status_code=status.HTTP_200_OK)
def get_members(company_id:UUID, db:Session=db_dependency, current_user:User=user_dependency):
    return company_membership_service.get_members(db, company_id, current_user)


@router.patch("/member/{member_id}/", dependencies=[hr_admin_dependency], response_model=MembershipResponse, status_code=status.HTTP_200_OK)
def update_member(membership_id:UUID, payload:MembershipUpdate, db:Session=db_dependency, current_user:User=user_dependency):
    return company_membership_service.update_member(db, membership_id, payload, current_user)


@router.delete("/member/{member_id}", dependencies=[hr_admin_dependency], response_model=None, status_code=status.HTTP_204_NO_CONTENT)
def delete_member(membership_id:UUID, db:Session=db_dependency, current_user:User=user_dependency):
    return company_membership_service.remove_member(db, membership_id, current_user)