from app.api.application import router as application_router
from app.api.auth import router as auth_router
from app.api.candidate_profile import router as candidate_profile_router
from app.api.company import router as company_router
from app.api.company_membership import router as company_membership_router
from app.api.interview import router as interview_router
from app.api.interview_feedback import router as interview_feedback_router
from app.api.job import router as job_router
from app.api.resume import router as resume_router
from app.api.saved_job import router as saved_job_router
from app.api.user import router as user_router
from app.core import exceptions, exceptions_handler, logging
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, Request, Response
from sqlalchemy import text
from sqlalchemy.orm import Session
from time import perf_counter
from uuid import uuid4

from app.core.config import settings
from app.db.session import get_db

logging.setup_logging()


# root
app = FastAPI(
    title="track-hire",
    version="1.0.0",
    description="Full-stack job hiring platform built with React, FastAPI, PostgreSQL, and role-based authentication.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    started_at = perf_counter()
    try:
        response: Response = await call_next(request)
    finally:
        duration_ms = (perf_counter() - started_at) * 1000
        logging.get_logger(__name__).info(
            "request_complete method=%s path=%s request_id=%s duration_ms=%.2f",
            request.method,
            request.url.path,
            request_id,
            duration_ms,
        )
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


@app.get("/ready", tags=["Health"])
def readiness_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ready"}

# Exceptions
app.add_exception_handler(exceptions.AppException, exceptions_handler.app_exception_handler)
app.add_exception_handler(RequestValidationError,  exceptions_handler.validation_exception_handler)
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
app.include_router(saved_job_router, prefix="/api/saved-jobs", tags=["Saved Jobs"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(interview_router, prefix="/interviews", tags=["Interviews"])
app.include_router(interview_feedback_router, prefix="/interviews", tags=["Interview Feedback"])
