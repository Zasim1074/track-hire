from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    CompanyNotFoundError,
    ForbiddenError,
    InactiveUserError,
    InvalidCredentialsError,
)
from app.db.session import get_db
from app.models.application import Application
from app.models.company_membership import CompanyMembership, MembershipRole
from app.models.interview import Interview
from app.models.user import User, UserRole
from app.repositories.company_membership_repository import get_active_membership
from app.repositories.company_repository import get_company_by_id
from app.repositories.user_repository import get_by_id

security = HTTPBearer()
security_dependency = Depends(security)
db_dependency = Depends(get_db)


def get_current_user(credentials: HTTPAuthorizationCredentials = security_dependency, db: Session = db_dependency) -> User:
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )

        user_id = payload.get("sub")
        if user_id is None:
            raise InvalidCredentialsError
        user_id = UUID(user_id)

    except (JWTError, ValueError):
        raise InvalidCredentialsError

    user = get_by_id(db, user_id)
    if user is None:
        raise InvalidCredentialsError

    return user


user_dependency = Depends(get_current_user)


def get_current_active_user(current_user: User = user_dependency) -> User:
    if not current_user.is_active:
        raise InactiveUserError
    return current_user


def require_roles(*required_roles: UserRole):
    def role_checker(current_user: User = user_dependency) -> User:
        if current_user.role not in required_roles:
            raise ForbiddenError
        return current_user

    return role_checker


def require_company_owner(company_id: UUID, current_user: User = user_dependency, db: Session = db_dependency) -> User:
    if current_user.role == UserRole.ADMIN:
        return current_user

    company = get_company_by_id(db, company_id)
    if company is None:
        raise CompanyNotFoundError

    if company.owner_id != current_user.id:
        raise ForbiddenError

    return current_user


def require_company_membership(db: Session, company_id: UUID, user: User) -> CompanyMembership | None:
    if user.role == UserRole.ADMIN:
        return None

    membership = get_active_membership(db, company_id, user.id)
    if membership is None:
        raise ForbiddenError

    if membership.role not in {MembershipRole.HR, MembershipRole.RECRUITER}:
        raise ForbiddenError

    return membership


def require_application_access(
    db: Session,
    application: Application,
    current_user: User,
) -> None:

    if current_user.role == UserRole.ADMIN:
        return

    if current_user.role == UserRole.CANDIDATE:
        if application.candidate_id != current_user.id:
            raise ForbiddenError
        return

    if current_user.role == MembershipRole.HR:
        require_company_membership(
            db,
            application.job.company_id,
            current_user,
        )
        return

    raise ForbiddenError



def require_interview_access(
    db: Session,
    interview: Interview,
    current_user: User,
) -> None:

    application = interview.application

    if current_user.role == UserRole.ADMIN:
        return

    if current_user.role == UserRole.CANDIDATE:

        if application.candidate_id != current_user.id:
            raise ForbiddenError

        return

    if current_user.role == MembershipRole.HR:

        require_company_membership(
            db,
            application.job.company_id,
            current_user,
        )

        return

    raise ForbiddenError