from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile


UPLOAD_DIR = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_resume(file: UploadFile) -> tuple[str, str]:
    extensions = Path(file.filename or "").suffix.lower()
    
    file_name = f"{uuid4()}{extensions}"
    file_path = UPLOAD_DIR / file_name
    
    content = await file.read()
    file_path.write_bytes(content)
    
    return file_name, str(file_path)