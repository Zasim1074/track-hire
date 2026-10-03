from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_active_user, require_roles
from app.db.session import get_db
from app.models.company_membership import MembershipRole
from app.models.user import User, UserRole
from app.schemas.user import UserResponse

router = APIRouter()
db_dependency = Depends(get_db)
user_dependency = Depends(get_current_active_user)
hr_admin_required = Depends(require_roles(UserRole.ADMIN, MembershipRole.HR, MembershipRole.RECRUITER, MembershipRole.OWNER))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = user_dependency):
    return current_user


@router.get("/hr-test", dependencies=[hr_admin_required])
def hr_test():
    return {"message": "You have HR access"}
