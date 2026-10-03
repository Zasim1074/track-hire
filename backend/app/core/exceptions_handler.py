import logging

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


async def validation_exception_hanlder(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Request validation failed.", "errors": exc.errors()})


async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)


async def unexpected_request_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception | method=%s | path=%s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server Error"})
