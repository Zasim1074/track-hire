from uuid import UUID

from sqlalchemy.orm import Session

from app.core.dependencies import require_company_membership, require_interview_access
from app.core.exceptions import (
    FeedbackAlreadyExistsError,
    FeedbackNotAllowedError,
    FeedbackNotFoundError,
    ForbiddenError,
    InterviewNotFoundError,
)
from app.models.interview import InterviewStatus
from app.models.interview_feedback import InterviewFeedback
from app.models.user import User, UserRole
from app.repositories.interview_feedback_repository import (
    create,
    get_by_interview_id,
)
from app.repositories.interview_repository import get_by_id as get_interview_by_id
from app.schemas.interview_feedback import (
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
)


def create_feedback(
    db: Session,
    interview_id: UUID,
    payload: InterviewFeedbackCreate,
    current_user: User,
) -> InterviewFeedbackResponse:

    interview = get_interview_by_id(
        db,
        interview_id,
    )

    if interview is None:
        raise InterviewNotFoundError

    # Only the assigned interviewer can submit feedback
    if interview.interviewer_id != current_user.id:
        raise ForbiddenError

    # Interview must be completed
    if interview.status != InterviewStatus.COMPLETED:
        raise FeedbackNotAllowedError

    # Prevent duplicate feedback
    existing_feedback = get_by_interview_id(
        db,
        interview_id,
    )

    if existing_feedback is not None:
        raise FeedbackAlreadyExistsError

    feedback = InterviewFeedback(
        interview_id=interview.id,
        interviewer_id=current_user.id,
        rating=payload.rating,
        recommendation=payload.recommendation,
        strengths=payload.strengths,
        weaknesses=payload.weaknesses,
        comments=payload.comments,
    )

    created_feedback = create(
        db,
        feedback,
    )

    return InterviewFeedbackResponse.model_validate(created_feedback)


def get_feedback(db: Session, interview_id: UUID, current_user: User) -> InterviewFeedbackResponse:
    interview = get_interview_by_id(db, interview_id)

    if interview is None:
        raise InterviewNotFoundError

    # Access to the interview itself determines feedback access
    require_interview_access(db, interview, current_user)
    feedback = get_by_interview_id(db, interview_id)

    if feedback is None:
        raise FeedbackNotFoundError

    return InterviewFeedbackResponse.model_validate(feedback)
