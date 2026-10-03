from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, require_roles
from app.db.session import get_db
from app.models.company_membership import MembershipRole
from app.models.job import EmploymentType, ExperienceLevel, JobStatus, WorkMode
from app.models.user import User, UserRole
from app.schemas.job import JobCreate, JobListResponse, JobResponse, JobUpdate
from app.services import job_service

router = APIRouter()

user_dependency = Depends(get_current_active_user)
db_dependency = Depends(get_db)
hr_admin_required = Depends(require_roles(UserRole.ADMIN, MembershipRole.HR, MembershipRole.RECRUITER, MembershipRole.OWNER))
optional_bearer = HTTPBearer(auto_error=False)

page_query = Query(1)
page_size_query = Query(10, le=100)
search_query = Query(None)
status_query = Query(None)
work_mode_query = Query(None)
employment_type_query = Query(None)
experience_level_query = Query(None)


@router.post("/companies/{company_id}/jobs", dependencies=[hr_admin_required] ,response_model=JobResponse,status_code=status.HTTP_201_CREATED)
def create_job(company_id: UUID,payload: JobCreate,current_user: User = user_dependency,db: Session = db_dependency):
    return job_service.create_job(db, company_id, current_user, payload)


@router.post("/jobs", dependencies=[Depends(require_roles(UserRole.HR, UserRole.ADMIN))], response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job_for_current_user(payload: JobCreate, current_user: User = user_dependency, db: Session = db_dependency):
    return job_service.create_job_for_user(db, current_user, payload)


@router.get("/jobs", response_model=JobListResponse, status_code=status.HTTP_200_OK)
def get_jobs(page: int = page_query, page_size: int = page_size_query, search: str | None = search_query, status: JobStatus | None = status_query, work_mode: WorkMode | None = work_mode_query, employment_type: EmploymentType | None = employment_type_query, experience_level: ExperienceLevel | None = experience_level_query, db: Session = db_dependency ):
    return job_service.get_jobs(db, page, page_size, search, status, work_mode, employment_type, experience_level)


@router.get("/jobs/me", response_model=JobListResponse)
def get_my_jobs(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), current_user: User = user_dependency, db: Session = db_dependency):
    return job_service.get_my_jobs(db, current_user, page, page_size)


@router.get("/jobs/{job_id}", response_model=JobResponse, status_code=status.HTTP_200_OK)
def get_job(
    job_id: UUID,
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = db_dependency,
):
    current_user = None
    if credentials is not None:
        from app.core.dependencies import get_current_user

        current_user = get_current_user(credentials, db)
    return job_service.get_job(db, job_id, current_user)


@router.patch("/jobs/{job_id}", dependencies=[hr_admin_required],response_model=JobResponse, status_code=status.HTTP_200_OK)
def update_job(job_id: UUID, payload:JobUpdate, current_user: User = user_dependency, db:Session = db_dependency):
    return job_service.update_job(db, job_id, payload, current_user)


@router.delete("/jobs/{job_id}", dependencies=[hr_admin_required], status_code=204)
def delete_job(job_id:UUID, current_user:User = user_dependency, db:Session=db_dependency):
    return job_service.delete_job(db, job_id, current_user)


@router.post("/jobs/{job_id}/publish", dependencies=[hr_admin_required], response_model=JobResponse, status_code=status.HTTP_200_OK)
def publish_job(job_id:UUID, current_user:User=user_dependency, db:Session=db_dependency):
    return job_service.publish_job(db, job_id, current_user)


@router.post("/jobs/{job_id}/close", dependencies=[hr_admin_required], response_model=JobResponse, status_code=status.HTTP_200_OK)
def close_job(job_id:UUID, current_user:User=user_dependency, db:Session=db_dependency):
    return job_service.close_job(db, job_id, current_user)
