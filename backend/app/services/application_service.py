import math
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.application_workflow import VALID_TRANSITIONS
from app.core.dependencies import require_application_access, require_company_membership
from app.core.exceptions import (
    AlreadyAppliedError,
    ApplicationAlreadyExistsError,
    ApplicationDecisionNotAllowedError,
    ApplicationNotFoundError,
    ForbiddenError,
    InvalidApplicationStatusTransitionError,
    JobNotAcceptingApplicationsError,
    JobNotFoundError,
    ResumeNotFoundError,
)
from app.models.application import Application, ApplicationStatus
from app.models.application_history import ApplicationStatusHistory
from app.models.company_membership import MembershipRole
from app.models.interview import InterviewStatus
from app.models.job import JobStatus
from app.models.user import User, UserRole
from app.repositories.application_repository import (
    create,
    get_by_application_id,
    get_by_candidate_id,
    get_by_id,
    get_by_job_and_candidate,
    get_by_job_id,
)
from app.repositories.job_repository import get_job_by_id
from app.repositories.resume_repository import get_by_id as get_resume_by_id
from app.schemas.application import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationReject,
    ApplicationResponse,
    ApplicationStatusHistoryResponse,
    ApplicationStatusUpdate,
)


def apply_for_job(
    db: Session, job_id: UUID, payload: ApplicationCreate, current_user: User
) -> ApplicationResponse:
    job = get_job_by_id(db, job_id)
    if job is None or job.status != JobStatus.PUBLISHED or not job.is_active:
        raise JobNotFoundError

    existing_application = get_by_job_and_candidate(db, job_id, current_user.id)
    if existing_application is not None:
        raise ApplicationAlreadyExistsError

    application = Application(
        job_id=job.id,
        candidate_id=current_user.id,
        resume_id=payload.resume_id,
        cover_letter=payload.cover_letter,
    )

    created_application = create(db, application)
    return ApplicationResponse.model_validate(created_application)


def get_my_applications(
    db: Session,
    current_user: User,
    page: int,
    page_size: int,
    application_status: ApplicationStatus | None = None,
) -> ApplicationListResponse:
    applications, total = get_by_candidate_id(
        db, current_user.id, page, page_size, application_status
    )
    total_pages = math.ceil(total / page_size)

    return ApplicationListResponse(
        items=[
            ApplicationResponse.model_validate(application)
            for application in applications
        ],
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        total=total,
    )


def get_job_applications(
    db: Session,
    job_id: UUID,
    current_user: User,
    page: int,
    page_size: int,
    application_status: ApplicationStatus | None,
) -> ApplicationListResponse:
    job = get_job_by_id(db, job_id)

    if job is None:
        raise JobNotFoundError

    require_company_membership(db, job.company_id, current_user)
    applications, total = get_by_job_id(db, job_id, page, page_size, application_status)
    total_pages = math.ceil(total / page_size)

    return ApplicationListResponse(
        items=[
            ApplicationResponse.model_validate(application)
            for application in applications
        ],
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        total=total,
    )


def update_application_status(
    db: Session,
    application_id: UUID,
    payload: ApplicationStatusUpdate,
    current_user: User,
) -> ApplicationResponse:

    application = get_by_id(
        db,
        application_id,
    )

    if application is None:
        raise ApplicationNotFoundError

    require_application_access(
        db,
        application,
        current_user,
    )

    if current_user.role == UserRole.CANDIDATE:
        raise ForbiddenError

    old_status = application.status
    new_status = payload.status

    allowed_statuses = VALID_TRANSITIONS.get(
        old_status,
        set(),
    )

    if new_status not in allowed_statuses:
        raise InvalidApplicationStatusTransitionError

    application.status = new_status
    application.recruiter_notes = payload.recruiter_notes

    history = ApplicationStatusHistory(
        application_id=application.id,
        from_status=old_status,
        to_status=new_status,
        changed_by=current_user.id,
        notes=payload.recruiter_notes,
    )

    db.add(history)

    db.commit()
    db.refresh(application)

    return ApplicationResponse.model_validate(application)


def withdraw_application(
    db: Session,
    application_id: UUID,
    current_user: User,
) -> ApplicationResponse:

    application = get_by_id(
        db,
        application_id,
    )

    if application is None:
        raise ApplicationNotFoundError

    # Only the candidate who owns the application can withdraw it
    if application.candidate_id != current_user.id:
        raise ForbiddenError

    # Only active applications can be withdrawn
    if application.status in {
        ApplicationStatus.SELECTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
    }:
        raise InvalidApplicationStatusTransitionError

    old_status = application.status

    application.status = ApplicationStatus.WITHDRAWN

    history = ApplicationStatusHistory(
        application_id=application.id,
        from_status=old_status,
        to_status=ApplicationStatus.WITHDRAWN,
        changed_by=current_user.id,
        notes="Application withdrawn by candidate.",
    )

    db.add(history)

    db.commit()
    db.refresh(application)

    return ApplicationResponse.model_validate(application)


def create_application(
    db: Session,
    job_id: UUID,
    payload: ApplicationCreate,
    current_user: User,
) -> ApplicationResponse:

    # 1. Only candidates can apply
    if current_user.role != UserRole.CANDIDATE:
        raise ForbiddenError

    # 2. Job must exist
    job = get_job_by_id(db, job_id)

    if job is None:
        raise JobNotFoundError

    # 3. Job must be published
    if job.status != JobStatus.PUBLISHED:
        raise JobNotAcceptingApplicationsError

    # 4. Resume must exist
    resume = get_resume_by_id(
        db,
        payload.resume_id,
    )

    if resume is None:
        raise ResumeNotFoundError

    # 5. Resume must belong to current candidate
    if resume.candidate_id != current_user.id:
        raise ForbiddenError

    # 6. Candidate cannot apply twice
    existing_application = get_by_job_and_candidate(
        db,
        job_id,
        current_user.id,
    )

    if existing_application is not None:
        raise AlreadyAppliedError

    # 7. Create application
    application = Application(
        job_id=job_id,
        candidate_id=current_user.id,
        resume_id=payload.resume_id,
        cover_letter=payload.cover_letter,
        status=ApplicationStatus.APPLIED,
    )

    created_application = create(
        db,
        application,
    )

    return ApplicationResponse.model_validate(created_application)


def get_application_history(
    db: Session,
    application_id: UUID,
    current_user: User,
) -> list[ApplicationStatusHistoryResponse]:

    application = get_by_id(
        db,
        application_id,
    )

    if application is None:
        raise ApplicationNotFoundError

    require_application_access(
        db,
        application,
        current_user,
    )

    history = get_by_application_id(
        db,
        application_id,
    )

    return [ApplicationStatusHistoryResponse.model_validate(item) for item in history]


def get_application(
    db: Session,
    application_id: UUID,
    current_user: User,
) -> ApplicationResponse:

    application = get_by_id(
        db,
        application_id,
    )

    if application is None:
        raise ApplicationNotFoundError

    require_application_access(
        db,
        application,
        current_user,
    )

    return ApplicationResponse.model_validate(application)


def select_application(
    db: Session,
    application_id: UUID,
    current_user: User,
) -> ApplicationResponse:

    application = get_by_id(
        db,
        application_id,
    )

    if application is None:
        raise ApplicationNotFoundError

    if current_user.role not in {
        MembershipRole.HR,
        UserRole.ADMIN,
    }:
        raise ForbiddenError

    if current_user.role == MembershipRole.HR:
        require_company_membership(
            db,
            application.job.company_id,
            current_user,
        )

    if application.status in {
        ApplicationStatus.SELECTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
    }:
        raise InvalidApplicationStatusTransitionError

    if application.status != ApplicationStatus.INTERVIEW:
        raise ApplicationDecisionNotAllowedError

    # Candidate must have at least one completed interview
    completed_interview = any(
        interview.status == InterviewStatus.COMPLETED
        for interview in application.interviews
    )
    interviews = application.interviews

    if not interviews:
        raise ApplicationDecisionNotAllowedError

    if any(
        interview.status != InterviewStatus.COMPLETED
        for interview in interviews
    ):
        raise ApplicationDecisionNotAllowedError

    if not completed_interview:
        raise ApplicationDecisionNotAllowedError

    application.status = ApplicationStatus.SELECTED

    db.commit()
    db.refresh(application)

    return ApplicationResponse.model_validate(application)


def reject_application(
    db: Session,
    application_id: UUID,
    payload: ApplicationReject,
    current_user: User,
) -> ApplicationResponse:

    application = get_by_id(
        db,
        application_id,
    )

    if application is None:
        raise ApplicationNotFoundError

    if current_user.role not in {
        MembershipRole.HR,
        UserRole.ADMIN,
    }:
        raise ForbiddenError

    if current_user.role == MembershipRole.HR:
        require_company_membership(
            db,
            application.job.company_id,
            current_user,
        )

    if application.status in {
        ApplicationStatus.SELECTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
    }:
        raise InvalidApplicationStatusTransitionError

    if application.status != ApplicationStatus.INTERVIEW:
        raise ApplicationDecisionNotAllowedError

    application.status = ApplicationStatus.REJECTED

    # Store reason if you have a rejection_reason column
    if payload.reason:
        application.recruiter_notes = payload.reason

    db.commit()
    db.refresh(application)

    return ApplicationResponse.model_validate(application)