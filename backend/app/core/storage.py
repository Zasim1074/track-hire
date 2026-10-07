from collections.abc import AsyncIterator
from typing import Any
from uuid import UUID, uuid4

import anyio
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ObjectStorageError, ResumeNotFoundError


def _client() -> Any:
    if not all((
        settings.r2_account_id,
        settings.r2_access_key_id,
        settings.r2_secret_access_key,
        settings.r2_bucket_name,
        settings.r2_endpoint_url,
    )):
        raise ObjectStorageError
    try:
        return boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
        )
    except (BotoCoreError, ClientError) as exc:
        raise ObjectStorageError from exc


async def save_resume(candidate_id: UUID, file: UploadFile, extension: str) -> str:
    key = f"resumes/{candidate_id}/{uuid4()}{extension}"
    try:
        await anyio.to_thread.run_sync(
            lambda: _client().upload_fileobj(
                file.file,
                settings.r2_bucket_name,
                key,
                ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
            )
        )
    except (BotoCoreError, ClientError, OSError) as exc:
        raise ObjectStorageError from exc
    return key


async def download_resume(key: str) -> Any:
    try:
        return await anyio.to_thread.run_sync(
            lambda: _client().get_object(Bucket=settings.r2_bucket_name, Key=key)["Body"]
        )
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in {"404", "NoSuchKey", "NotFound"}:
            raise ResumeNotFoundError from exc
        raise ObjectStorageError from exc
    except (BotoCoreError, OSError) as exc:
        raise ObjectStorageError from exc


async def delete_resume_object(key: str) -> None:
    try:
        await anyio.to_thread.run_sync(
            lambda: _client().delete_object(Bucket=settings.r2_bucket_name, Key=key)
        )
    except (BotoCoreError, ClientError, OSError) as exc:
        raise ObjectStorageError from exc


async def stream_object(body: Any, chunk_size: int = 64 * 1024) -> AsyncIterator[bytes]:
    try:
        while chunk := await anyio.to_thread.run_sync(body.read, chunk_size):
            yield chunk
    finally:
        await anyio.to_thread.run_sync(body.close)
