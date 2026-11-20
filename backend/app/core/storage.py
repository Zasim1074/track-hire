from collections.abc import AsyncIterator
from pathlib import Path
from typing import BinaryIO
from uuid import UUID, uuid4

import anyio
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ObjectStorageError, ResumeNotFoundError


def _storage_root() -> Path:
    return settings.resume_storage_path.expanduser().resolve()


def _object_path(key: str) -> Path:
    root = _storage_root()
    path = (root / key).resolve()
    if root != path and root not in path.parents:
        raise ObjectStorageError
    return path


async def save_resume(candidate_id: UUID, file: UploadFile, extension: str) -> str:
    key = f"resumes/{candidate_id}/{uuid4()}{extension}"
    path = _object_path(key)
    contents = await file.read()

    def write() -> None:
        try:
            path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            with path.open("xb") as destination:
                destination.write(contents)
            path.chmod(0o600)
        except OSError as exc:
            raise ObjectStorageError from exc

    await anyio.to_thread.run_sync(write)
    return key


async def download_resume(key: str) -> BinaryIO:
    path = _object_path(key)

    def open_file() -> BinaryIO:
        try:
            return path.open("rb")
        except FileNotFoundError as exc:
            raise ResumeNotFoundError from exc
        except OSError as exc:
            raise ObjectStorageError from exc

    return await anyio.to_thread.run_sync(open_file)


async def delete_resume_object(key: str) -> None:
    path = _object_path(key)

    def remove() -> None:
        try:
            path.unlink()
        except FileNotFoundError as exc:
            raise ResumeNotFoundError from exc
        except OSError as exc:
            raise ObjectStorageError from exc

    await anyio.to_thread.run_sync(remove)


async def stream_object(body: BinaryIO, chunk_size: int = 64 * 1024) -> AsyncIterator[bytes]:
    try:
        while chunk := await anyio.to_thread.run_sync(body.read, chunk_size):
            yield chunk
    finally:
        await anyio.to_thread.run_sync(body.close)
