from pydantic import BaseModel
from typing import Literal
from app.models.user import UserRole

from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: Literal[UserRole.CANDIDATE, UserRole.HR] = UserRole.CANDIDATE

class RegisterResponse(BaseModel):
    detail: str
    user: UserResponse


class LoginRequest(BaseModel):
    email: str
    password: str


class AccessToken(BaseModel):
    access_token: str
    token_type: str
    
class LoginResponse(BaseModel):
    detail: str
    token: AccessToken
    user: UserResponse
