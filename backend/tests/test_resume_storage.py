from pathlib import Path
from uuid import UUID

import pytest

from app.core.config import settings
from app.core.exceptions import ObjectStorageError
from app.models.resume import Resume


PDF = b"%PDF-1.7\nresume contents"


@pytest.fixture(autouse=True)
def private_storage(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "resume_storage_path", tmp_path)
    return tmp_path


def object_path(root: Path, key: str) -> Path:
    path = root / key
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def test_resume_upload_download_and_default_resume(client, candidate_headers, candidate_user, private_storage, db):
    response = client.post(
        "/resumes",
        headers=candidate_headers,
        files={"file": ("My Resume.pdf", PDF, "application/pdf")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["file_name"] == "My Resume.pdf"
    assert data["is_default"] is True
    assert "file_url" not in data
    stored_resume = db.get(Resume, UUID(data["id"]))
    assert stored_resume.file_url.startswith(f"resumes/{candidate_user.id}/")
    assert stored_resume.file_url.endswith(".pdf")
    assert (private_storage / stored_resume.file_url).read_bytes() == PDF

    downloaded = client.get(f"/resumes/{data['id']}/download", headers=candidate_headers)
    assert downloaded.status_code == 200
    assert downloaded.content == PDF
    assert "My%20Resume.pdf" in downloaded.headers["content-disposition"]
    assert downloaded.headers["cache-control"] == "private, no-store"


def test_resume_upload_rejects_extension_mime_signature_and_size(client, candidate_headers):
    invalid_extension = client.post("/resumes", headers=candidate_headers, files={"file": ("resume.txt", b"x", "text/plain")})
    invalid_mime = client.post("/resumes", headers=candidate_headers, files={"file": ("resume.pdf", PDF, "text/plain")})
    invalid_signature = client.post("/resumes", headers=candidate_headers, files={"file": ("resume.pdf", b"not a PDF", "application/pdf")})
    oversized = client.post(
        "/resumes", headers=candidate_headers,
        files={"file": ("resume.pdf", b"%PDF-" + b"x" * (5 * 1024 * 1024), "application/pdf")},
    )
    assert invalid_extension.status_code == 400
    assert invalid_mime.status_code == 400
    assert invalid_signature.status_code == 400
    assert oversized.status_code == 400


def test_resume_upload_requires_candidate_role(client, hr_headers, private_storage):
    response = client.post("/resumes", headers=hr_headers, files={"file": ("resume.pdf", PDF, "application/pdf")})
    assert response.status_code == 403
    assert not list(private_storage.rglob("*"))


def test_resume_download_rejects_unrelated_user(client, candidate_user, user_factory, resume_factory, authenticated_headers):
    other = user_factory()
    resume = resume_factory(other)
    response = client.get(f"/resumes/{resume.id}/download", headers=authenticated_headers(candidate_user))
    assert response.status_code == 403


def test_admin_can_download_resume(client, admin_headers, candidate_user, resume_factory, db, private_storage):
    resume = resume_factory(candidate_user)
    resume.file_url = "resumes/candidate/admin-download.pdf"
    object_path(private_storage, resume.file_url).write_bytes(PDF)
    db.flush()

    response = client.get(f"/resumes/{resume.id}/download", headers=admin_headers)
    assert response.status_code == 200
    assert response.content == PDF


def test_missing_storage_object_returns_resume_not_found(client, candidate_headers, candidate_user, resume_factory, db):
    resume = resume_factory(candidate_user)
    resume.file_url = "resumes/missing/resume.pdf"
    db.flush()
    response = client.get(f"/resumes/{resume.id}/download", headers=candidate_headers)
    assert response.status_code == 404


def test_resume_delete_removes_private_object_and_database_record(client, candidate_headers, candidate_user, resume_factory, db, private_storage):
    resume = resume_factory(candidate_user)
    resume.file_url = "resumes/test/resume.pdf"
    stored = object_path(private_storage, resume.file_url)
    stored.write_bytes(PDF)
    db.flush()

    response = client.delete(f"/resumes/{resume.id}", headers=candidate_headers)
    assert response.status_code == 204
    assert not stored.exists()
    assert db.get(Resume, resume.id) is None


def test_storage_failure_returns_safe_error_and_keeps_resume_record(client, candidate_headers, candidate_user, resume_factory, db, monkeypatch):
    import app.services.resume_service as service

    async def fail(_key):
        raise ObjectStorageError

    monkeypatch.setattr(service, "delete_resume_object", fail)
    resume = resume_factory(candidate_user)
    db.flush()
    response = client.delete(f"/resumes/{resume.id}", headers=candidate_headers)
    assert response.status_code == 503
    assert response.json()["detail"] == "Resume storage is temporarily unavailable."
    assert db.get(Resume, resume.id) is not None


def test_resume_upload_storage_failure_returns_safe_error(client, candidate_headers, monkeypatch):
    import app.services.resume_service as service

    async def fail(*_args):
        raise ObjectStorageError

    monkeypatch.setattr(service, "save_resume", fail)
    response = client.post("/resumes", headers=candidate_headers, files={"file": ("resume.pdf", PDF, "application/pdf")})
    assert response.status_code == 503
    assert response.json()["detail"] == "Resume storage is temporarily unavailable."
