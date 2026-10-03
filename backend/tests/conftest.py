from collections.abc import Generator
from datetime import datetime, timedelta, timezone
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.exc import ArgumentError
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.application import Application, ApplicationStatus
from app.models.company import Company, CompanySize, Industry
from app.models.company_membership import CompanyMembership, MembershipRole
from app.models.interview import Interview, InterviewStatus, InterviewType
from app.models.job import EmploymentType, ExperienceLevel, Job, JobStatus, WorkMode
from app.models.resume import Resume
from app.models.user import User, UserRole


def _create_test_engine() -> Engine:
    configured_url = settings.test_database_url
    if not configured_url:
        raise pytest.UsageError(
            "Set TEST_DATABASE_URL in backend/.env or the environment before "
            "running tests. It must point to the dedicated "
            "'track_hire_test_db' database."
        )

    try:
        test_url = make_url(configured_url)
        development_url = make_url(settings.database_url)
    except (ArgumentError, TypeError, ValueError) as exc:
        raise pytest.UsageError("TEST_DATABASE_URL must be a valid PostgreSQL URL.") from exc

    if test_url.drivername not in {"postgresql", "postgresql+psycopg"}:
        raise pytest.UsageError(
            "TEST_DATABASE_URL must use PostgreSQL and the psycopg driver."
        )

    if test_url.database != "track_hire_test_db":
        raise pytest.UsageError(
            "TEST_DATABASE_URL must target the dedicated 'track_hire_test_db' database."
        )

    if development_url.database == test_url.database:
        raise pytest.UsageError(
            "TEST_DATABASE_URL must not target the development database."
        )

    test_url = test_url.set(drivername="postgresql+psycopg")
    test_engine = create_engine(
        test_url,
        echo=False,
        pool_pre_ping=True,
    )
    return test_engine


test_engine = _create_test_engine()
TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(scope="session", autouse=True)
def setup_database() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=test_engine)

    try:
        yield
    finally:
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


@pytest.fixture
def db() -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    db = TestingSessionLocal(
        bind=connection,
        join_transaction_mode="create_savepoint",
    )

    try:
        yield db
    finally:
        db.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def user_factory(db: Session):
    def create_user(
        role: UserRole = UserRole.CANDIDATE,
        *,
        email: str | None = None,
        is_active: bool = True,
        password: str = "test-password",
    ) -> User:
        user = User(
            email=email or f"{uuid.uuid4()}@example.test",
            password_hash=hash_password(password),
            first_name="Test",
            last_name="User",
            role=role,
            is_active=is_active,
        )
        db.add(user)
        db.flush()
        return user

    return create_user


@pytest.fixture
def candidate_user(user_factory):
    return user_factory(UserRole.CANDIDATE)


@pytest.fixture
def hr_user(user_factory):
    return user_factory(UserRole.HR)


@pytest.fixture
def admin_user(user_factory):
    return user_factory(UserRole.ADMIN)


@pytest.fixture
def authenticated_headers():
    def headers_for(user: User) -> dict[str, str]:
        token = create_access_token({"sub": str(user.id)})
        return {"Authorization": f"Bearer {token}"}

    return headers_for


@pytest.fixture
def candidate_headers(candidate_user: User, authenticated_headers):
    return authenticated_headers(candidate_user)


@pytest.fixture
def hr_headers(hr_user: User, authenticated_headers):
    return authenticated_headers(hr_user)


@pytest.fixture
def admin_headers(admin_user: User, authenticated_headers):
    return authenticated_headers(admin_user)


@pytest.fixture
def company_factory(db: Session):
    def create_company(owner: User, *, name: str | None = None) -> Company:
        unique = str(uuid.uuid4())
        company = Company(
            name=name or f"Test Company {unique}",
            description="A company used by backend tests.",
            website=f"https://{unique}.example.test",
            location="Remote",
            logo_url="https://example.test/logo.png",
            industry=Industry.SOFTWARE,
            company_size=CompanySize.STARTUP,
            owner_id=owner.id,
            is_verified=True,
            is_active=True,
        )
        db.add(company)
        db.flush()
        return company

    return create_company


@pytest.fixture
def membership_factory(db: Session):
    def create_membership(
        company: Company,
        user: User,
        role: MembershipRole = MembershipRole.HR,
        *,
        is_active: bool = True,
    ) -> CompanyMembership:
        membership = CompanyMembership(
            company_id=company.id,
            user_id=user.id,
            role=role,
            is_active=is_active,
        )
        db.add(membership)
        db.flush()
        return membership

    return create_membership


@pytest.fixture
def company(admin_user: User, company_factory):
    return company_factory(admin_user)


@pytest.fixture
def hr_company(company: Company, hr_user: User, membership_factory):
    membership_factory(company, hr_user)
    return company


@pytest.fixture
def job_factory(db: Session):
    def create_job(
        company: Company,
        creator: User,
        *,
        status: JobStatus = JobStatus.PUBLISHED,
        is_active: bool = True,
    ) -> Job:
        job = Job(
            title="Backend Engineer",
            description="Build backend services.",
            location="Remote",
            work_mode=WorkMode.REMOTE,
            employment_type=EmploymentType.FULL_TIME,
            experience_level=ExperienceLevel.ENTRY,
            min_experience=0,
            max_experience=3,
            min_salary=70000,
            max_salary=100000,
            skills=["Python", "PostgreSQL"],
            status=status,
            is_active=is_active,
            company_id=company.id,
            created_by=creator.id,
        )
        db.add(job)
        db.flush()
        return job

    return create_job


@pytest.fixture
def resume_factory(db: Session):
    def create_resume(candidate: User) -> Resume:
        resume = Resume(
            candidate_id=candidate.id,
            file_name="resume.pdf",
            file_url="https://example.test/resume.pdf",
            is_default=True,
        )
        db.add(resume)
        db.flush()
        return resume

    return create_resume


@pytest.fixture
def application_factory(db: Session, resume_factory):
    def create_application(
        job: Job,
        candidate: User,
        *,
        status: ApplicationStatus = ApplicationStatus.APPLIED,
        resume: Resume | None = None,
    ) -> Application:
        application = Application(
            job_id=job.id,
            candidate_id=candidate.id,
            resume_id=(resume or resume_factory(candidate)).id,
            status=status,
        )
        db.add(application)
        db.flush()
        return application

    return create_application


@pytest.fixture
def interview_factory(db: Session):
    def create_interview(
        application: Application,
        interviewer: User,
        *,
        status: InterviewStatus = InterviewStatus.SCHEDULED,
        scheduled_at: datetime | None = None,
        round_number: int = 1,
    ) -> Interview:
        interview = Interview(
            application_id=application.id,
            interviewer_id=interviewer.id,
            round_number=round_number,
            scheduled_at=scheduled_at or datetime.now(timezone.utc) + timedelta(days=2),
            duration_minutes=60,
            meeting_url="https://example.test/meeting",
            interview_type=InterviewType.VIDEO,
            status=status,
            notes="Test interview",
        )
        db.add(interview)
        db.flush()
        return interview

    return create_interview