import math
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import (
    CannotDeleteCompanyError,
    CompanyAlreadyExistsError,
    CompanyNotFoundError,
    ForbiddenError,
)
from app.models.company import Company, CompanySize, Industry
from app.models.user import User
from app.repositories.company_repository import (
    create,
    get_company_by_id,
    get_company_by_website,
)
from app.repositories.company_repository import delete_company as repo_delete_company
from app.repositories.company_repository import get_companies as repo_get_companies
from app.repositories.company_repository import update_company as repo_update_company
from app.schemas.company import (
    CompanyCreate,
    CompanyListResponse,
    CompanyResponse,
    CompanyUpdate,
)


def create_company(db: Session, current_user: User, payload: CompanyCreate) -> dict:
    existing_company = get_company_by_website(db, payload.website)

    if existing_company is not None:
        raise CompanyAlreadyExistsError

    company = Company(
        name=payload.name,
        description=payload.description,
        website=payload.website,
        location=payload.location,
        logo_url=payload.logo_url,
        industry=payload.industry,
        company_size=payload.company_size,
        owner_id=current_user.id,
    )

    created_company = create(db, company)
    return {
        "message": "Company added successfully!",
        "details": CompanyResponse.model_validate(created_company),
    }


def get_company(db: Session, company_id: UUID) -> CompanyResponse:
    company = get_company_by_id(db, company_id)
    if company is None:
        raise CompanyNotFoundError
    return CompanyResponse.model_validate(company)


def get_companies(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    industry: Industry | None = None,
    company_size: CompanySize | None = None,
) -> CompanyListResponse:
    companies, total = repo_get_companies(
        db, page, page_size, search=search, industry=industry, company_size=company_size
    )

    total_pages = math.ceil(total / page_size)

    return CompanyListResponse(
        items=companies,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        total=total,
    )


def update_company(
    db: Session, current_user: User, company_id: UUID, payload: CompanyUpdate
) -> CompanyResponse:
    company = get_company_by_id(db, company_id)

    if company is None:
        raise CompanyNotFoundError

    if current_user.id != company.owner_id:
        raise ForbiddenError

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(company, field, value)

    updated_company = repo_update_company(db, company)
    return CompanyResponse.model_validate(updated_company)


def delete_company(db: Session, current_user: User, company_id: UUID) -> str:
    company = get_company_by_id(db, company_id)

    if company is None:
        raise CompanyNotFoundError

    if len(company.jobs) > 0:
        raise CannotDeleteCompanyError

    if current_user.id != company.owner_id:
        raise ForbiddenError

    repo_delete_company(db, company_id)