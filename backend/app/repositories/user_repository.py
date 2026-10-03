from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User


def create(db: Session, user: User) -> User:
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(User.email == email)
    return db.scalar(stmt)


def get_by_id(db:Session, id:UUID) -> User | None:
    stmt = select(User).where(User.id == id)
    return db.scalar(stmt)