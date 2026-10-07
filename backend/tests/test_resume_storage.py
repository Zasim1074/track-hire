from app.core.config import settings
from app.models.resume import Resume


class FakeStorageBucket:
    def __init__(self):
        self.objects = {}
        self.deleted = []

    def upload(self, path, file, file_options=None):
        self.objects[path] = file

    def download(self, path):
        if path not in self.objects:
            raise FakeStorageError("Object not found", status_code=404)
        return self.objects[path]

    def remove(self, paths):
        self.deleted.extend(paths)
        for path in paths:
            self.objects.pop(path, None)


class FakeStorageError(Exception):
    def __init__(self, message, status_code=None):
        super().__init__(message)
        self.status_code = status_code


class FakeSupabase:
    def __init__(self, bucket):
        self.bucket = bucket
        self.storage = self

    def from_(self, bucket_name):
        assert bucket_name == "test-resumes"
        return self.bucket


def setup_fake_supabase(monkeypatch):
    import app.core.storage as storage

    bucket = FakeStorageBucket()
    client = FakeSupabase(bucket)
    monkeypatch.setattr(storage, "create_client", lambda url, secret: client)
    monkeypatch.setattr(settings, "supabase_url", "https://example.test")
    monkeypatch.setattr(settings, "supabase_secret_key", "test-secret")
    monkeypatch.setattr(settings, "supabase_bucket_name", "test-resumes")
    return bucket


def test_resume_upload_download_and_default_resume(client, candidate_headers, candidate_user, monkeypatch):
    bucket = setup_fake_supabase(monkeypatch)
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
    assert bucket.objects[data["file_url"]] == b"resume contents"

    downloaded = client.get(f"/resumes/{data['id']}/download", headers=candidate_headers)
    assert downloaded.status_code == 200
    assert downloaded.content == b"resume contents"
    assert "My%20Resume.pdf" in downloaded.headers["content-disposition"]


def test_resume_upload_rejects_invalid_extension_and_files_over_5mb(client, candidate_headers, monkeypatch):
    setup_fake_supabase(monkeypatch)
    invalid = client.post("/resumes", headers=candidate_headers, files={"file": ("resume.txt", b"x")})
    oversized = client.post(
        "/resumes", headers=candidate_headers,
        files={"file": ("resume.pdf", b"x" * (5 * 1024 * 1024 + 1), "application/pdf")},
    )
    assert invalid.status_code == 400
    assert oversized.status_code == 400


def test_resume_upload_requires_candidate_role(client, hr_headers, monkeypatch):
    bucket = setup_fake_supabase(monkeypatch)
    response = client.post("/resumes", headers=hr_headers, files={"file": ("resume.pdf", b"x")})
    assert response.status_code == 403
    assert bucket.objects == {}


def test_resume_download_rejects_unrelated_user(client, candidate_user, user_factory, resume_factory, authenticated_headers):
    other = user_factory()
    resume = resume_factory(other)
    response = client.get(
        f"/resumes/{resume.id}/download",
        headers=authenticated_headers(candidate_user),
    )
    assert response.status_code == 403


def test_admin_can_download_resume(client, admin_headers, candidate_user, resume_factory, db, monkeypatch):
    bucket = setup_fake_supabase(monkeypatch)
    resume = resume_factory(candidate_user)
    resume.file_url = "resumes/candidate/admin-download.pdf"
    bucket.objects[resume.file_url] = b"admin-visible bytes"
    db.flush()

    response = client.get(f"/resumes/{resume.id}/download", headers=admin_headers)

    assert response.status_code == 200
    assert response.content == b"admin-visible bytes"


def test_missing_supabase_object_returns_resume_not_found(client, candidate_headers, candidate_user, resume_factory, db, monkeypatch):
    setup_fake_supabase(monkeypatch)
    resume = resume_factory(candidate_user)
    db.flush()

    response = client.get(f"/resumes/{resume.id}/download", headers=candidate_headers)

    assert response.status_code == 404


def test_resume_delete_removes_supabase_object_and_database_record(client, candidate_headers, candidate_user, resume_factory, db, monkeypatch):
    bucket = setup_fake_supabase(monkeypatch)
    resume = resume_factory(candidate_user)
    resume.file_url = "resumes/test/resume.pdf"
    bucket.objects[resume.file_url] = b"contents"
    db.flush()

    response = client.delete(f"/resumes/{resume.id}", headers=candidate_headers)

    assert response.status_code == 204
    assert "resumes/test/resume.pdf" in bucket.deleted
    assert db.get(Resume, resume.id) is None


def test_storage_failure_returns_safe_error_and_keeps_resume_record(client, candidate_headers, candidate_user, resume_factory, db, monkeypatch):
    import app.core.storage as storage

    class BrokenBucket:
        def remove(self, paths):
            raise RuntimeError("provider details must not reach the client")

    client_instance = FakeSupabase(BrokenBucket())
    monkeypatch.setattr(storage, "create_client", lambda url, secret: client_instance)
    monkeypatch.setattr(settings, "supabase_url", "https://example.test")
    monkeypatch.setattr(settings, "supabase_secret_key", "test-secret")
    monkeypatch.setattr(settings, "supabase_bucket_name", "test-resumes")
    resume = resume_factory(candidate_user)
    db.flush()

    response = client.delete(f"/resumes/{resume.id}", headers=candidate_headers)

    assert response.status_code == 503
    assert response.json()["detail"] == "Resume storage is temporarily unavailable."
    assert db.get(Resume, resume.id) is not None


def test_resume_upload_storage_failure_returns_safe_error(client, candidate_headers, monkeypatch):
    import app.core.storage as storage

    class BrokenBucket:
        def upload(self, **kwargs):
            raise RuntimeError("provider details must not reach the client")

    client_instance = FakeSupabase(BrokenBucket())
    monkeypatch.setattr(storage, "create_client", lambda url, secret: client_instance)
    monkeypatch.setattr(settings, "supabase_url", "https://example.test")
    monkeypatch.setattr(settings, "supabase_secret_key", "test-secret")
    monkeypatch.setattr(settings, "supabase_bucket_name", "test-resumes")

    response = client.post("/resumes", headers=candidate_headers, files={"file": ("resume.pdf", b"x")})
    assert response.status_code == 503
    assert response.json()["detail"] == "Resume storage is temporarily unavailable."
