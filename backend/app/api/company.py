from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, require_roles
from app.db.session import get_db
from app.models.company import CompanySize, Industry
from app.models.company_membership import MembershipRole
from app.models.user import User, UserRole
from app.schemas.company import (
    CompanyCreate,
    CompanyListResponse,
    CompanyResponse,
    CompanyUpdate,
)
from app.services import company_service

router = APIRouter()
db_dependency = Depends(get_db)
hr_admin_dependency =  Depends(require_roles(UserRole.ADMIN, MembershipRole.HR, MembershipRole.RECRUITER, MembershipRole.OWNER))
industry_query = Query(None)
company_size_query = Query(None)
user_dependency = Depends(get_current_active_user)


@router.post("/", dependencies=[hr_admin_dependency], status_code=status.HTTP_201_CREATED, response_model=dict)
def add(payload: CompanyCreate, current_user:User = user_dependency, db: Session = db_dependency):
    return company_service.create_company(db, current_user,payload)


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: UUID, db: Session = db_dependency):
    return company_service.get_company(db, company_id)


@router.patch("/{company_id}", dependencies=[hr_admin_dependency], response_model=CompanyResponse)
def update_company(company_id: UUID, payload:CompanyUpdate, current_user:User=user_dependency, db:Session= db_dependency) -> CompanyResponse:
    return company_service.update_company(db, current_user, company_id, payload)


@router.delete("/{company_id}", dependencies=[hr_admin_dependency], status_code=204)
def delete_company(company_id: UUID, current_user: User = user_dependency, db:Session=db_dependency):
    return company_service.delete_company(db, current_user, company_id)


@router.get("/", response_model=CompanyListResponse)
def get_companies( page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), search: str | None = Query(None, min_length=1), industry: Industry | None = industry_query, company_size: CompanySize | None = company_size_query, db: Session = db_dependency ):
    return company_service.get_companies( db=db, page=page, page_size=page_size, search=search, industry=industry, company_size=company_size)