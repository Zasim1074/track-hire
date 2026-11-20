from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import User


def create(db: Session, user: User) -> User:
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(func.lower(User.email) == email.strip().lower())
    return db.scalar(stmt)


def get_by_id(db:Session, id:UUID) -> User | None:
    stmt = select(User).where(User.id == id)
    return db.scalar(stmt)


def update(db: Session, user: User) -> User:
    db.commit()
    db.refresh(user)
    return user
