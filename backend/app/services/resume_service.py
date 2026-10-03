from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.exceptions import (
    ForbiddenError,
    InvalidResumeFileError,
    ResumeNotFoundError,
)
from app.core.storage import save_resume
from app.models.resume import Resume
from app.models.user import User, UserRole
from app.repositories.resume_repository import (
    create,
    delete,
    get_by_candidate,
    get_by_id,
    set_default,
)
from app.schemas.resume import ResumeResponse

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_SIZE = 5 * 1024 * 1024


async def upload_resume(db: Session, file: UploadFile, current_user: User) -> ResumeResponse:
    if current_user.role != UserRole.CANDIDATE:
        raise ForbiddenError

    extension = Path(file.filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise InvalidResumeFileError

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise InvalidResumeFileError

    await file.seek(0)

    file_name, file_url = await save_resume(file)
    existing_resumes = get_by_candidate(db, current_user.id)

    resume = Resume(
        candidate_id=current_user.id,
        file_name=file.filename or file_name,
        file_url=file_url,
        is_default=len(existing_resumes) == 0,
    )

    created_resume = create(db, resume)
    return ResumeResponse.model_validate(created_resume)


def get_my_resumes(db: Session, current_user: User) -> list[ResumeResponse]:
    if current_user.role != UserRole.CANDIDATE:
        raise ForbiddenError

    resumes = get_by_candidate(db, current_user.id)
    return [ResumeResponse.model_validate(resume) for resume in resumes]


def get_resume(db: Session, resume_id:UUID, current_user: User) -> ResumeResponse:
    resume = get_by_id(db, resume_id)

    if resume is None:
        raise ResumeNotFoundError

    if current_user.role != UserRole.ADMIN and resume.candidate_id != current_user.id:
        raise ForbiddenError

    return ResumeResponse.model_validate(resume)


def delete_resume(db: Session, resume_id: UUID, current_user: User ) -> None:
    resume = get_by_id(db, resume_id)

    if resume is None:
        raise ResumeNotFoundError

    if current_user.role != UserRole.ADMIN and resume.candidate_id != current_user.id:
        raise ForbiddenError

    delete(db, resume)


def set_default_resume(db: Session, resume_id: UUID, current_user: User) -> ResumeResponse:
    resume = get_by_id(db, resume_id)

    if resume is None:
        raise ResumeNotFoundError

    if resume.candidate_id != current_user.id:
        raise ForbiddenError

    updated_resume = set_default(db, current_user.id, resume_id)

    if updated_resume is None:
        raise ResumeNotFoundError

    return ResumeResponse.model_validate(updated_resume)
