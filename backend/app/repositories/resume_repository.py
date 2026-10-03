import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import Resume


def create(db: Session, resume: Resume) -> Resume:
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def get_by_id(db: Session, resume_id: uuid.UUID) -> Resume | None:
    stmt = select(Resume).where(Resume.id == resume_id)
    return db.scalar(stmt)


def get_by_candidate(db: Session, candidate_id: uuid.UUID) -> list[Resume]:
    stmt = (select(Resume).where(Resume.candidate_id == candidate_id).order_by(Resume.created_at.desc()))
    return list(db.scalars(stmt))


def get_default(db: Session, candidate_id: uuid.UUID) -> Resume | None:
    stmt = select(Resume).where(Resume.candidate_id == candidate_id, Resume.is_default.is_(True))
    return db.scalar(stmt)


def set_default(db: Session, candidate_id: uuid.UUID, resume_id: uuid.UUID ) -> Resume | None:
    resumes = get_by_candidate(db, candidate_id)
    target = None

    for resume in resumes:
        if resume.id == resume_id:
            target = resume
        else:
            resume.is_default = False

    if target is None:
        return None

    target.is_default = True

    db.commit()
    db.refresh(target)
    return target


def delete(db: Session, resume: Resume) -> None:
    db.delete(resume)
    db.commit()