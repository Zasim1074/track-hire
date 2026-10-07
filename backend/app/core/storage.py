from collections.abc import AsyncIterator
from io import BytesIO
from typing import Any
from uuid import UUID, uuid4

import anyio
from fastapi import UploadFile
from supabase import create_client

from app.core.config import settings
from app.core.exceptions import ObjectStorageError, ResumeNotFoundError


def _storage_bucket() -> Any:
    if not all((settings.supabase_url, settings.supabase_secret_key, settings.supabase_bucket_name)):
        raise ObjectStorageError
    try:
        client = create_client(settings.supabase_url, settings.supabase_secret_key)
        return client.storage.from_(settings.supabase_bucket_name)
    except Exception as exc:
        raise ObjectStorageError from exc


async def save_resume(candidate_id: UUID, file: UploadFile, extension: str) -> str:
    key = f"resumes/{candidate_id}/{uuid4()}{extension}"
    contents = await file.read()

    def upload() -> None:
        try:
            _storage_bucket().upload(
                path=key,
                file=contents,
                file_options={
                    "content-type": file.content_type or "application/octet-stream",
                    "upsert": "false",
                },
            )
        except Exception as exc:
            print("SUPABASE RESUME UPLOAD ERROR:", repr(exc))
            raise ObjectStorageError from exc

    await anyio.to_thread.run_sync(upload)
    return key


async def download_resume(key: str) -> Any:
    def download() -> BytesIO:
        try:
            result = _storage_bucket().download(key)
            return BytesIO(result)
        except Exception as exc:
            status_code = getattr(exc, "status_code", None)
            if status_code == 404 or "not found" in str(exc).lower():
                raise ResumeNotFoundError from exc
            raise ObjectStorageError from exc

    return await anyio.to_thread.run_sync(download)


async def delete_resume_object(key: str) -> None:
    def delete() -> None:
        try:
            _storage_bucket().remove([key])
        except Exception as exc:
            raise ObjectStorageError from exc

    await anyio.to_thread.run_sync(delete)


async def stream_object(body: Any, chunk_size: int = 64 * 1024) -> AsyncIterator[bytes]:
    try:
        while chunk := await anyio.to_thread.run_sync(body.read, chunk_size):
            yield chunk
    finally:
        await anyio.to_thread.run_sync(body.close)


# git add .
# git commit -m "new update 1"
# git push origin main