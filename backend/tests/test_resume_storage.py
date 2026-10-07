import io

from botocore.exceptions import ClientError

from app.core.config import settings
from app.models.resume import Resume


class FakeR2:
    def __init__(self):
        self.objects = {}
        self.deleted = []

    def upload_fileobj(self, fileobj, bucket, key, ExtraArgs=None):
        self.objects[key] = fileobj.read()

    def get_object(self, Bucket, Key):
        return {"Body": io.BytesIO(self.objects[Key])}

    def delete_object(self, Bucket, Key):
        self.deleted.append((Bucket, Key))
        self.objects.pop(Key, None)


def setup_fake_r2(monkeypatch):
    import app.core.storage as storage

    fake = FakeR2()
    monkeypatch.setattr(storage.boto3, "client", lambda *args, **kwargs: fake)
    monkeypatch.setattr(settings, "r2_account_id", "test-account")
    monkeypatch.setattr(settings, "r2_access_key_id", "test-key")
    monkeypatch.setattr(settings, "r2_secret_access_key", "test-secret")
    monkeypatch.setattr(settings, "r2_bucket_name", "test-bucket")
    monkeypatch.setattr(settings, "r2_endpoint_url", "https://example.test")
    return fake


def test_resume_upload_download_and_default_resume(client, candidate_headers, candidate_user, db, monkeypatch):
    fake = setup_fake_r2(monkeypatch)
    response = client.post(
        "/resumes",
        headers=candidate_headers,
        files={"file": ("My Resume.pdf", b"resume contents", "application/pdf")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["file_name"] == "My Resume.pdf"
    assert data["is_default"] is True
    assert data["file_url"].startswith(f"resumes/{candidate_user.id}/")
    assert data["file_url"].endswith(".pdf")
    assert fake.objects[data["file_url"]] == b"resume contents"

    downloaded = client.get(f"/resumes/{data['id']}/download", headers=candidate_headers)
    assert downloaded.status_code == 200
    assert downloaded.content == b"resume contents"
    assert "My%20Resume.pdf" in downloaded.headers["content-disposition"]


def test_resume_upload_rejects_invalid_extension_and_files_over_5mb(client, candidate_headers, monkeypatch):
    setup_fake_r2(monkeypatch)
    invalid = client.post("/resumes", headers=candidate_headers, files={"file": ("resume.txt", b"x")})
    oversized = client.post(
        "/resumes", headers=candidate_headers,
        files={"file": ("resume.pdf", b"x" * (5 * 1024 * 1024 + 1), "application/pdf")},
    )
    assert invalid.status_code == 400
    assert oversized.status_code == 400


def test_resume_upload_requires_candidate_role(client, hr_headers, monkeypatch):
    fake = setup_fake_r2(monkeypatch)
    response = client.post("/resumes", headers=hr_headers, files={"file": ("resume.pdf", b"x")})
    assert response.status_code == 403
    assert fake.objects == {}


def test_resume_download_rejects_unrelated_user(client, candidate_user, user_factory, resume_factory, authenticated_headers):
    other = user_factory()
    resume = resume_factory(other)
    response = client.get(
        f"/resumes/{resume.id}/download",
        headers=authenticated_headers(candidate_user),
    )
    assert response.status_code == 403


def test_admin_can_download_resume(client, admin_headers, candidate_user, resume_factory, db, monkeypatch):
    fake = setup_fake_r2(monkeypatch)
    resume = resume_factory(candidate_user)
    resume.file_url = "resumes/candidate/admin-download.pdf"
    fake.objects[resume.file_url] = b"admin-visible bytes"
    db.flush()

    response = client.get(f"/resumes/{resume.id}/download", headers=admin_headers)

    assert response.status_code == 200
    assert response.content == b"admin-visible bytes"


def test_missing_r2_object_returns_resume_not_found(client, candidate_headers, candidate_user, resume_factory, db, monkeypatch):
    import app.core.storage as storage

    class MissingR2:
        def get_object(self, **kwargs):
            raise ClientError({"Error": {"Code": "NoSuchKey", "Message": "private"}}, "GetObject")

    monkeypatch.setattr(storage.boto3, "client", lambda *args, **kwargs: MissingR2())
    monkeypatch.setattr(settings, "r2_account_id", "test-account")
    monkeypatch.setattr(settings, "r2_access_key_id", "test-key")
    monkeypatch.setattr(settings, "r2_secret_access_key", "test-secret")
    monkeypatch.setattr(settings, "r2_bucket_name", "test-bucket")
    monkeypatch.setattr(settings, "r2_endpoint_url", "https://example.test")
    resume = resume_factory(candidate_user)
    db.flush()

    response = client.get(f"/resumes/{resume.id}/download", headers=candidate_headers)

    assert response.status_code == 404


def test_resume_delete_removes_r2_object_and_database_record(client, candidate_headers, candidate_user, resume_factory, db, monkeypatch):
    fake = setup_fake_r2(monkeypatch)
    resume = resume_factory(candidate_user)
    resume.file_url = "resumes/test/resume.pdf"
    fake.objects[resume.file_url] = b"contents"
    db.flush()

    response = client.delete(f"/resumes/{resume.id}", headers=candidate_headers)

    assert response.status_code == 204
    assert ("test-bucket", "resumes/test/resume.pdf") in fake.deleted
    assert db.get(Resume, resume.id) is None


def test_storage_failure_returns_safe_error_and_keeps_resume_record(client, candidate_headers, candidate_user, resume_factory, db, monkeypatch):
    import app.core.storage as storage

    class BrokenR2:
        def delete_object(self, **kwargs):
            raise ClientError({"Error": {"Code": "InternalError", "Message": "private"}}, "DeleteObject")

    monkeypatch.setattr(storage.boto3, "client", lambda *args, **kwargs: BrokenR2())
    monkeypatch.setattr(settings, "r2_account_id", "test-account")
    monkeypatch.setattr(settings, "r2_access_key_id", "test-key")
    monkeypatch.setattr(settings, "r2_secret_access_key", "test-secret")
    monkeypatch.setattr(settings, "r2_bucket_name", "test-bucket")
    monkeypatch.setattr(settings, "r2_endpoint_url", "https://example.test")
    resume = resume_factory(candidate_user)
    db.flush()

    response = client.delete(f"/resumes/{resume.id}", headers=candidate_headers)

    assert response.status_code == 503
    assert response.json()["detail"] == "Resume storage is temporarily unavailable."
    assert db.get(Resume, resume.id) is not None


def test_resume_upload_storage_failure_returns_safe_error(client, candidate_headers, monkeypatch):
    import app.core.storage as storage

    class BrokenR2:
        def upload_fileobj(self, *args, **kwargs):
            raise ClientError({"Error": {"Code": "InternalError", "Message": "private"}}, "PutObject")

    monkeypatch.setattr(storage.boto3, "client", lambda *args, **kwargs: BrokenR2())
    monkeypatch.setattr(settings, "r2_account_id", "test-account")
    monkeypatch.setattr(settings, "r2_access_key_id", "test-key")
    monkeypatch.setattr(settings, "r2_secret_access_key", "test-secret")
    monkeypatch.setattr(settings, "r2_bucket_name", "test-bucket")
    monkeypatch.setattr(settings, "r2_endpoint_url", "https://example.test")

    response = client.post("/resumes", headers=candidate_headers, files={"file": ("resume.pdf", b"x")})
    assert response.status_code == 503
    assert response.json()["detail"] == "Resume storage is temporarily unavailable."
