from uuid import UUID

from sqlalchemy.orm import Session

from app.core.dependencies import require_company_membership, require_interview_access
from app.core.exceptions import (
    ApplicationNotFoundError,
    ForbiddenError,
    InterviewConflictError,
    InterviewerNotEligibleError,
    InterviewerNotFoundError,
    InterviewNotAllowedError,
    InterviewNotFoundError,
    InvalidInterviewStatusTransitionError,
)
from app.models.application import ApplicationStatus
from app.models.application_history import ApplicationStatusHistory
from app.models.company_membership import MembershipRole
from app.models.interview import Interview, InterviewStatus
from app.models.user import User, UserRole
from app.repositories.application_repository import get_by_id as get_application_by_id
from app.repositories.interview_repository import (
    create,
    get_by_application_id,
    get_next_round_number,
    has_conflict,
)
from app.repositories.interview_repository import get_by_id as get_interview_by_id
from app.repositories.interview_repository import (
    get_latest_interview as repo_get_latest_interview,
)
from app.repositories.user_repository import get_by_id as get_user_by_id
from app.schemas.interview import InterviewCreate, InterviewResponse, InterviewUpdate

VALID_INTERVIEW_TRANSITIONS = {
    InterviewStatus.SCHEDULED: {
        InterviewStatus.COMPLETED,
        InterviewStatus.CANCELLED,
        InterviewStatus.NO_SHOW,
    },
    InterviewStatus.COMPLETED: set(),
    InterviewStatus.CANCELLED: set(),
    InterviewStatus.NO_SHOW: set(),
}


def create_interview(db: Session, application_id: UUID, payload: InterviewCreate, current_user: User) -> InterviewResponse:
    application = get_application_by_id(db, application_id)

    if application is None:
        raise ApplicationNotFoundError

    if current_user.role not in {MembershipRole.HR, UserRole.ADMIN}:
        raise ForbiddenError

    if current_user.role == MembershipRole.HR:
        require_company_membership(db, application.job.company_id, current_user)

    if application.status not in {ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW}:
        raise InterviewNotAllowedError

    interviewer = get_user_by_id(db, payload.interviewer_id)

    if interviewer is None:
        raise InterviewerNotFoundError

    if interviewer.role != MembershipRole.HR:
        raise InterviewerNotEligibleError

    require_company_membership(db, application.job.company_id, interviewer)

    if has_conflict(db,interviewer.id, payload.scheduled_at, payload.duration_minutes):
        raise InterviewConflictError

    round_number = get_next_round_number(db, application.id)
    
    # Create interview
    interview = Interview(
        application_id=application.id,
        interviewer_id=interviewer.id,
        round_number=round_number,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
        meeting_url=payload.meeting_url,
        interview_type=payload.interview_type,
        status=InterviewStatus.SCHEDULED,
        notes=payload.notes,
    )

    db.add(interview)

    # Update application status
    old_status = application.status
    application.status = ApplicationStatus.INTERVIEW

    # Create status history
    history = ApplicationStatusHistory(
        application_id=application.id,
        from_status=old_status,
        to_status=ApplicationStatus.INTERVIEW,
        changed_by=current_user.id,
        notes="Interview scheduled.",
    )

    db.add(history)

    # One transaction
    db.commit()
    db.refresh(interview)
    return InterviewResponse.model_validate(interview)


def get_interview(db: Session, interview_id: UUID, current_user: User) -> InterviewResponse:
    interview = get_interview_by_id(db, interview_id)

    if interview is None:
        raise InterviewNotFoundError

    require_interview_access(db, interview, current_user)

    return InterviewResponse.model_validate(interview)


def get_application_interviews(db: Session, application_id: UUID, current_user: User) -> list[InterviewResponse]:
    application = get_application_by_id(db, application_id)

    if application is None:
        raise ApplicationNotFoundError

    # Candidate → only their own application
    if current_user.role == UserRole.CANDIDATE and application.candidate_id != current_user.id:
            raise ForbiddenError
    # HR → must belong to application's company
    elif current_user.role == MembershipRole.HR:
        require_company_membership(db,application.job.company_id, current_user)
    # Admin → allowed
    elif current_user.role == UserRole.ADMIN:
        pass
    else:
        raise ForbiddenError

    interviews = get_by_application_id(db, application_id)
    return [InterviewResponse.model_validate(interview) for interview in interviews]


def update_interview(
    db: Session,
    interview_id: UUID,
    payload: InterviewUpdate,
    current_user: User,
) -> InterviewResponse:

    interview = get_interview_by_id(
        db,
        interview_id,
    )

    if interview is None:
        raise InterviewNotFoundError

    if current_user.role not in {
        MembershipRole.HR,
        UserRole.ADMIN,
    }:
        raise ForbiddenError

    if current_user.role == MembershipRole.HR:
        require_company_membership(
            db,
            interview.application.job.company_id,
            current_user,
        )

    if interview.status != InterviewStatus.SCHEDULED:
        raise InterviewNotAllowedError

    updates = payload.model_dump(
        exclude_unset=True,
    )

    new_interviewer_id = updates.get(
        "interviewer_id",
        interview.interviewer_id,
    )

    new_scheduled_at = updates.get(
        "scheduled_at",
        interview.scheduled_at,
    )

    new_duration = updates.get(
        "duration_minutes",
        interview.duration_minutes,
    )

    # Validate interviewer if changing
    interviewer = get_user_by_id(
        db,
        new_interviewer_id,
    )

    if interviewer is None:
        raise InterviewerNotFoundError

    if interviewer.role != MembershipRole.HR:
        raise InterviewerNotEligibleError

    require_company_membership(
        db,
        interview.application.job.company_id,
        interviewer,
    )

    # Check scheduling conflict
    if has_conflict(
        db,
        new_interviewer_id,
        new_scheduled_at,
        new_duration,
        exclude_interview_id=interview.id,
    ):
        raise InterviewConflictError

    # Apply updates
    for field, value in updates.items():
        setattr(interview, field, value)

    db.commit()
    db.refresh(interview)

    return InterviewResponse.model_validate(
        interview
    )

def cancel_interview(db: Session,interview_id: UUID,current_user: User) -> InterviewResponse:
    interview = get_interview_by_id(db,interview_id)

    if interview is None:
        raise InterviewNotFoundError

    # Only HR/Admin can cancel
    if current_user.role not in {MembershipRole.HR,UserRole.ADMIN,}:
        raise ForbiddenError

    # HR must belong to the company's hiring team
    if current_user.role == MembershipRole.HR:
        require_company_membership(db,interview.application.job.company_id,current_user,)

    # Only scheduled interviews can be cancelled
    if interview.status != InterviewStatus.SCHEDULED:
        raise InvalidInterviewStatusTransitionError

    interview.status = InterviewStatus.CANCELLED

    db.commit()
    db.refresh(interview)
    return InterviewResponse.model_validate(interview)


def complete_interview(db: Session,interview_id: UUID,current_user: User) -> InterviewResponse:
    interview = get_interview_by_id(db,interview_id)

    if interview is None:
        raise InterviewNotFoundError

    if current_user.role not in {MembershipRole.HR,UserRole.ADMIN,}:
        raise ForbiddenError

    if current_user.role == MembershipRole.HR:
        require_company_membership(db,interview.application.job.company_id,current_user,)

    if interview.status != InterviewStatus.SCHEDULED:
        raise InvalidInterviewStatusTransitionError

    interview.status = InterviewStatus.COMPLETED

    db.commit()
    db.refresh(interview)
    return InterviewResponse.model_validate(interview)


def no_show_interview(db: Session,interview_id: UUID,current_user: User) -> InterviewResponse:
    interview = get_interview_by_id(db,interview_id)

    if interview is None:
        raise InterviewNotFoundError

    if current_user.role not in {MembershipRole.HR,UserRole.ADMIN,}:
        raise ForbiddenError

    if current_user.role == MembershipRole.HR:
        require_company_membership(db,interview.application.job.company_id,current_user,)

    if interview.status != InterviewStatus.SCHEDULED:
        raise InvalidInterviewStatusTransitionError

    interview.status = InterviewStatus.NO_SHOW

    db.commit()
    db.refresh(interview)
    return InterviewResponse.model_validate(interview)


def get_latest_interview(db:Session, application_id:UUID):
    latest_interview = repo_get_latest_interview(db, application_id)

    if latest_interview is not None and latest_interview.status != InterviewStatus.COMPLETED:
        raise InterviewNotAllowedError