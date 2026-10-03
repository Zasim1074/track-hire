from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    ForbiddenError,
    MembershipAlreadyExistsError,
    MembershipNotFoundError,
    StatusCannotBeSameError,
)
from app.models.company_membership import CompanyMembership
from app.models.user import User
from app.repositories.company_membership_repository import (
    create,
    delete_membership,
    get_by_company,
    get_by_company_and_user,
    get_by_id,
    update_membership,
)
from app.repositories.company_repository import get_company_by_id
from app.schemas.company_membership import (
    MembershipCreate,
    MembershipResponse,
    MembershipUpdate,
)


def _check_company_manager(db:Session, company_id:UUID, current_user_id:User) -> None:
    company = get_company_by_id(db, company_id)
    if company is None:
        raise MembershipNotFoundError
    
    if company.owner_id != current_user_id:
        raise ForbiddenError
    

def add_member(db:Session, company_id:UUID, payload:MembershipCreate, current_user:User) -> MembershipResponse:
    _check_company_manager(db, company_id, current_user.id)
    
    existing_membership = get_by_company_and_user(db, company_id, payload.user_id)
    if existing_membership is not None:
        raise MembershipAlreadyExistsError
    
    membership = CompanyMembership(
        company_id=company_id,
        user_id=payload.user_id,
        role=payload.role
    )
    
    added_membership = create(db, membership)
    return MembershipResponse.model_validate(added_membership)


def get_members(db:Session, company_id:UUID, current_user:User) -> list[MembershipResponse]:
    _check_company_manager(db, company_id, current_user.id)
   
    members = get_by_company(db, company_id)
    return [MembershipResponse.model_validate(member) for member in members]


def update_member(db:Session, membership_id:UUID, payload:MembershipUpdate, current_user:User) -> MembershipResponse:
    membership = get_by_id(db, membership_id)
    if membership is None:
        raise MembershipNotFoundError
    
    _check_company_manager(db, membership.company_id, current_user.id)

    if membership.role == payload.role and membership.is_active == payload.is_active:
        raise StatusCannotBeSameError
    
    membership.role = payload.role
    membership.is_active = payload.is_active
    updated_membership = update_membership(db, membership)
    
    return MembershipResponse.model_validate(updated_membership)


def remove_member(db, membership_id:UUID, current_user:User) -> None:
    membership = get_by_id(db, membership_id)
    if membership is None:
        raise MembershipNotFoundError
    
    _check_company_manager(db, membership.company_id, current_user.id)
    delete_membership(db, membership)