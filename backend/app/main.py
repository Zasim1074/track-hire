from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError

from app.api.application import router as application_router
from app.api.auth import router as auth_router
from app.api.candidate_profile import router as candidate_profile_router
from app.api.company import router as company_router
from app.api.company_membership import router as company_membership_router
from app.api.interview import router as interview_router
from app.api.interview_feedback import router as interview_feedback_router
from app.api.job import router as job_router
from app.api.resume import router as resume_router
from app.api.user import router as user_router
from app.core import exceptions, exceptions_handler, logging

logging.setup_logging()


# root
app = FastAPI(
    title="track-hire-api",
    version="1.0.0",
    description="User based(Admin, HR & Candidate) workflow with proper Authentication and Authorization",
)


# Exceptions
app.add_exception_handler(exceptions.AppException, exceptions_handler.app_exception_handler)
app.add_exception_handler(RequestValidationError,  exceptions_handler.validation_exception_hanlder)
app.add_exception_handler(HTTPException, exceptions_handler.http_exception_handler)
app.add_exception_handler(Exception, exceptions_handler.unexpected_request_handler)


# API Routes
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(application_router, prefix="/api", tags=["Applications"])
app.include_router(job_router, prefix="/api", tags=["Jobs"])
app.include_router(candidate_profile_router, prefix="/candidates", tags=["Candidate Profile"])
app.include_router(company_router, prefix="/companies", tags=["Companies"])
app.include_router(company_membership_router, prefix="/companies", tags=["Company Members"])
app.include_router(resume_router, prefix="/resumes", tags=["Resumes"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(interview_router, prefix="/interviews", tags=["Interviews"])
app.include_router(interview_feedback_router, prefix="/interviews", tags=["Interview Feedback"])