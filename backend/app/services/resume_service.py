from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.exceptions import (
    ForbiddenError,
    InvalidResumeFileError,
    ResumeInUseError,
    ResumeNotFoundError,
)
from app.core.storage import delete_resume_object, download_resume, save_resume
from app.models.resume import Resume
from app.models.user import User, UserRole
from app.repositories.resume_repository import (
    create,
    delete,
    get_by_candidate,
    get_by_id,
    is_attached_to_application,
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

    if file.size is not None:
        too_large = file.size > MAX_FILE_SIZE
    else:
        too_large = len(await file.read(MAX_FILE_SIZE + 1)) > MAX_FILE_SIZE
    if too_large:
        raise InvalidResumeFileError

    await file.seek(0)

    existing_resumes = get_by_candidate(db, current_user.id)
    file_url = await save_resume(current_user.id, file, extension)

    resume = Resume(
        candidate_id=current_user.id,
        file_name=file.filename or f"resume{extension}",
        file_url=file_url,
        is_default=len(existing_resumes) == 0,
    )

    try:
        created_resume = create(db, resume)
    except Exception:
        try:
            await delete_resume_object(file_url)
        except Exception:
            pass
        raise
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


async def get_resume_download(db: Session, resume_id: UUID, current_user: User):
    resume = get_by_id(db, resume_id)
    if resume is None:
        raise ResumeNotFoundError
    if current_user.role != UserRole.ADMIN and resume.candidate_id != current_user.id:
        raise ForbiddenError
    return await download_resume(resume.file_url), resume.file_name


async def delete_resume(db: Session, resume_id: UUID, current_user: User ) -> None:
    resume = get_by_id(db, resume_id)

    if resume is None:
        raise ResumeNotFoundError

    if current_user.role != UserRole.ADMIN and resume.candidate_id != current_user.id:
        raise ForbiddenError

    if is_attached_to_application(db, resume_id):
        raise ResumeInUseError

    # Preserve the database record if R2 cannot delete the object.
    await delete_resume_object(resume.file_url)
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
