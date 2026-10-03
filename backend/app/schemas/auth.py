from pydantic import BaseModel

from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

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