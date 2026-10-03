from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db, require_roles
from app.models.application import ApplicationStatus
from app.models.company_membership import MembershipRole
from app.models.user import User, UserRole
from app.schemas.application import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationReject,
    ApplicationResponse,
    ApplicationStatusHistoryResponse,
    ApplicationStatusUpdate,
)
from app.services import application_service

router = APIRouter()
db_dependency = Depends(get_db)
user_dependency = Depends(get_current_active_user)
candidate_dependency = Depends(require_roles(UserRole.CANDIDATE))
hr_admin_dependency = Depends(require_roles(MembershipRole.HR, MembershipRole.RECRUITER, MembershipRole.OWNER, UserRole.ADMIN))


@router.post("/jobs/{job_id}/applications",dependencies=[candidate_dependency], response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(job_id:UUID, payload:ApplicationCreate, db:Session = db_dependency, current_user:User=user_dependency):
    return application_service.apply_for_job(db, job_id, payload, current_user)


@router.get("/jobs/{job_id}/applications", dependencies=[hr_admin_dependency], response_model=ApplicationListResponse, status_code=status.HTTP_200_OK)
def get_job_applications(job_id:UUID, application_status:ApplicationStatus | None=None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db:Session=db_dependency, current_user:User=user_dependency):
    return application_service.get_job_applications(db, job_id, current_user, page, page_size, application_status)


@router.get("/applications/me", dependencies=[candidate_dependency], response_model=ApplicationListResponse, status_code=status.HTTP_200_OK)
def get_my_applications(application_status:ApplicationStatus | None = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), search: str | None = Query(None, min_length=1),db:Session=db_dependency, current_user:User=user_dependency):
    return application_service.get_my_applications(db, current_user, page, page_size, application_status)


@router.patch("/applications/{application_id}/status", dependencies=[hr_admin_dependency], response_model=ApplicationResponse, status_code=status.HTTP_200_OK)
def update_application_Staus(application_id:UUID, payload:ApplicationStatusUpdate, db:Session=db_dependency, current_user:User=user_dependency):
    return application_service.update_application_status(db, application_id, payload,current_user)


@router.post("/applications/{applications_id}/withdraw", dependencies=[candidate_dependency], response_model=ApplicationResponse, status_code=status.HTTP_200_OK)
def withdraw_application(application_id:UUID, db:Session=db_dependency, current_user:User=user_dependency):
    return application_service.withdraw_application(db, application_id, current_user)


@router.get("/{application_id}/history", response_model=list[ApplicationStatusHistoryResponse])
def get_application_history(application_id: UUID, db: Session = db_dependency, current_user: User = user_dependency):
    return application_service.get_application_history(db, application_id, current_user)


@router.post("/{application_id}/select",response_model=ApplicationResponse)
def select_application(application_id: UUID,db: Session = db_dependency,current_user: User = user_dependency):
    return application_service.select_application(db,application_id,current_user)
    
    
@router.post("/{application_id}/reject",response_model=ApplicationResponse)
def reject_application(application_id: UUID,payload: ApplicationReject,db: Session = db_dependency,current_user: User = user_dependency):
    return application_service.reject_application(db,application_id,payload,current_user)