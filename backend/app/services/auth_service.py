from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import (
    EmailAlreadyExistsError,
    InactiveUserError,
    InvalidCredentialsError,
)
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.repositories.user_repository import create, get_by_email, update
from app.schemas.auth import (
    AccessToken,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ChangePasswordRequest,
)
from app.schemas.user import UserResponse


def register(db: Session, payload: RegisterRequest) -> RegisterResponse:
    existing_user = get_by_email(db, payload.email)

    if existing_user is not None:
        raise EmailAlreadyExistsError

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
    )

    try:
        created_user = create(db, user)
    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyExistsError from exc
    return RegisterResponse( detail="User created successfully!", user=UserResponse.model_validate(created_user))


def login(db: Session, payload: LoginRequest) -> LoginResponse:
    user = get_by_email(db, payload.email)

    if user is None:
        raise InvalidCredentialsError

    if not verify_password(payload.password, user.password_hash):
        raise InvalidCredentialsError

    if not user.is_active:
        raise InactiveUserError

    access_token = create_access_token(data={"sub": str(user.id)})
    return LoginResponse(
        detail="Logged In Successfully!",
        token=AccessToken(access_token=access_token, token_type="bearer"),
        user=UserResponse.model_validate(user),
    )


def change_password(db: Session, user: User, payload: ChangePasswordRequest) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise InvalidCredentialsError
    if verify_password(payload.new_password, user.password_hash):
        raise InvalidCredentialsError
    user.password_hash = hash_password(payload.new_password)
    update(db, user)
