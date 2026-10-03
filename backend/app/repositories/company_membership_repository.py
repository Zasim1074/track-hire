from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company_membership import CompanyMembership, MembershipRole


def get_active_membership(db:Session, company_id:UUID, user_id:UUID) -> CompanyMembership | None:
    stmt = select(CompanyMembership).where(CompanyMembership.company_id == company_id and CompanyMembership.user_id == user_id and CompanyMembership.is_active.is_(True))
    return db.scalars(stmt)


def create(db:Session, membership:CompanyMembership) -> CompanyMembership:
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def get_by_id(db:Session, membership_id:UUID) -> CompanyMembership | None:
    stmt = select(CompanyMembership).where(CompanyMembership.id == membership_id)
    return db.scalar(stmt)


def get_by_company_and_user(db:Session, company_id:UUID, user_id:UUID) -> CompanyMembership | None:
    stmt = select(CompanyMembership).where(CompanyMembership.company_id == company_id and CompanyMembership.user_id == user_id)
    return db.scalar(stmt)

def get_by_company(db: Session, company_id:UUID) -> list[CompanyMembership]:
    stmt = select(CompanyMembership).where(CompanyMembership.company_id == company_id).order_by(CompanyMembership.created_at.desc())
    return list(db.scalars(stmt))


def update_membership(db: Session, membership: CompanyMembership) -> MembershipRole:
    db.commit()
    db.refresh(membership)
    return membership


def delete_membership(db:Session, membership: CompanyMembership) -> None:
    db.delete(membership)
    db.commit()