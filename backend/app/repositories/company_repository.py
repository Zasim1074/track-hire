from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.company import Company, CompanySize, Industry


def create(db: Session, company: Company) -> Company:
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def get_company_by_id(db: Session, company_id: UUID) -> Company | None:
    stmt = select(Company).where(Company.id == company_id)
    return db.scalar(stmt)


def get_company_by_name(db: Session, name: str) -> list[Company]:
    stmt = select(Company).where(Company.name.ilike(f"%{name}%"))
    return list(db.scalars(stmt))


def get_company_by_website(db: Session, website: str) -> Company | None:
    stmt = select(Company).where(Company.website == website)
    return db.scalar(stmt)


def get_companies(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    industry: Industry | None = None,
    company_size: CompanySize | None = None,
) -> tuple[list[Company], int]:

    filters = [Company.is_active.is_(True)]

    if search:
        filters.append(Company.name.ilike(f"%{search}%"))
    if industry:
        filters.append(Company.industry == industry)
    if company_size:
        filters.append(Company.company_size == company_size)

    count_stmt = select(func.count()).select_from(Company).where(*filters)
    total = db.scalar(count_stmt) or 0
    offset = (page - 1) * page_size

    stmt = (
        select(Company)
        .where(*filters)
        .order_by(Company.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )

    companies = list(db.scalars(stmt).all())

    return companies, total


def update_company(db: Session, company: Company) -> Company:
    db.commit()
    db.refresh(company)
    return company


def delete_company(db: Session, company_id: UUID):
    company = get_company_by_id(db, company_id)
    db.delete(company)
    db.commit()