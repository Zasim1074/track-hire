"""Seed a rich, repeatable local TrackHire dataset without deleting existing rows."""

from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
from zipfile import ZIP_DEFLATED, ZipFile

from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.application import Application, ApplicationStatus
from app.models.candidate_profile import CandidateProfile
from app.models.company import Company, CompanySize, Industry
from app.models.company_membership import CompanyMembership, MembershipRole
from app.models.interview import Interview, InterviewStatus, InterviewType
from app.models.job import EmploymentType, ExperienceLevel, Job, JobStatus, WorkMode
from app.models.resume import Resume
from app.models.saved_job import SavedJob
from app.models.user import User, UserRole


PASSWORD = "DemoPass123!"
NOW = datetime.now(timezone.utc)

COMPANIES = [
    ("NovaStack Labs", Industry.SOFTWARE, "Bengaluru, Karnataka", CompanySize.MEDIUM),
    ("MintRiver Finance", Industry.FINTECH, "Mumbai, Maharashtra", CompanySize.LARGE),
    ("CareOrbit Health", Industry.HEALTHCARE, "Hyderabad, Telangana", CompanySize.MEDIUM),
    ("CartCraft Commerce", Industry.ECOMMERCE, "Gurugram, Haryana", CompanySize.LARGE),
    ("LearnLoom", Industry.EDTECH, "Pune, Maharashtra", CompanySize.SMALL),
    ("RoutePilot", Industry.LOGISTICS, "Chennai, Tamil Nadu", CompanySize.MEDIUM),
    ("PixelHarbor", Industry.MEDIA, "Noida, Uttar Pradesh", CompanySize.SMALL),
    ("CloudMosaic", Industry.CONSULTING, "Remote, India", CompanySize.ENTERPRISE),
]

ROLES = [
    ("Frontend Engineer", ["React", "JavaScript", "TypeScript", "HTML", "CSS", "REST APIs"], ExperienceLevel.MID),
    ("Backend Python Engineer", ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy", "Docker", "REST APIs"], ExperienceLevel.MID),
    ("Full Stack Developer", ["React", "Python", "PostgreSQL", "Git", "AWS", "Testing"], ExperienceLevel.SENIOR),
    ("Product Designer", ["Figma", "Design Systems", "User Research", "Prototyping", "Accessibility"], ExperienceLevel.MID),
    ("Data Analyst", ["SQL", "Python", "Power BI", "Excel", "Statistics", "Data Visualization"], ExperienceLevel.JUNIOR),
    ("DevOps Engineer", ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"], ExperienceLevel.SENIOR),
]

CANDIDATES = [
    ("Aarav", "Sharma", "Bengaluru", "Full Stack Engineer", 5, ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "AWS", "Docker", "Testing"]),
    ("Diya", "Patel", "Mumbai", "Frontend Engineer", 3, ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Accessibility", "Figma"]),
    ("Kabir", "Mehta", "Pune", "Backend Python Engineer", 4, ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy", "Docker", "Linux"]),
    ("Ananya", "Iyer", "Chennai", "Product Designer", 4, ["Figma", "Design Systems", "User Research", "Prototyping", "Accessibility"]),
    ("Rohan", "Verma", "Delhi", "Data Analyst", 2, ["SQL", "Python", "Power BI", "Excel", "Statistics"]),
    ("Meera", "Nair", "Hyderabad", "DevOps Engineer", 6, ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"]),
    ("Arjun", "Singh", "Noida", "Software Engineer", 3, ["JavaScript", "React", "Python", "Git", "REST APIs"]),
    ("Ishita", "Gupta", "Gurugram", "Full Stack Developer", 5, ["React", "Python", "PostgreSQL", "AWS", "Testing", "Docker"]),
]


def _get_user(db, email: str, first_name: str, last_name: str, role: UserRole) -> User:
    user = db.scalar(select(User).where(func.lower(User.email) == email.lower()))
    if user is None:
        user = User(email=email, first_name=first_name, last_name=last_name, role=role, password_hash=hash_password(PASSWORD), is_active=True)
        db.add(user)
        db.flush()
    else:
        user.first_name, user.last_name, user.role, user.is_active = first_name, last_name, role, True
        user.password_hash = hash_password(PASSWORD)
    return user


def _write_docx(path: Path, full_name: str, headline: str, years: int, skills: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    text = (
        f"{full_name}. {headline} with {years}+ years of experience. Skills: {', '.join(skills)}. "
        "Delivered measurable product improvements, reliable APIs, accessible interfaces, automated testing, "
        "cross-functional collaboration and production support."
    )
    document = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{text}</w:t></w:r></w:p></w:body></w:document>'''
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        archive.writestr("word/document.xml", document)
    path.chmod(0o600)


def seed() -> None:
    db = SessionLocal()
    try:
        candidates: list[tuple[User, Resume]] = []
        for index, (first, last, location, headline, years, skills) in enumerate(CANDIDATES, start=1):
            user = _get_user(db, f"candidate{index}.demo@trackhire.local", first, last, UserRole.CANDIDATE)
            profile = db.scalar(select(CandidateProfile).where(CandidateProfile.user_id == user.id))
            if profile is None:
                profile = CandidateProfile(user_id=user.id)
                db.add(profile)
            profile.phone = f"+91 90000 00{index:03d}"
            profile.headline, profile.location, profile.experience_years = headline, location, years
            profile.bio = f"Demo candidate focused on {', '.join(skills[:3])} and measurable product outcomes."
            profile.linkedin_url = f"https://linkedin.com/in/{first.lower()}-{last.lower()}-demo"
            profile.github_url = f"https://github.com/{first.lower()}-{last.lower()}-demo"
            db.flush()

            file_name = f"{first.lower()}-{last.lower()}-resume.docx"
            resume = db.scalar(select(Resume).where(Resume.candidate_id == user.id, Resume.file_name == file_name))
            key = f"resumes/{user.id}/demo-resume.docx"
            if resume is None:
                resume = Resume(candidate_id=user.id, file_name=file_name, file_url=key, is_default=True)
                db.add(resume)
            resume.is_default = True
            resume.file_url = key
            storage_path = (settings.resume_storage_path.expanduser().resolve() / key).resolve()
            _write_docx(storage_path, f"{first} {last}", headline, years, skills)
            candidates.append((user, resume))

        companies: list[tuple[Company, User]] = []
        jobs: list[Job] = []
        modes = [WorkMode.REMOTE, WorkMode.HYBRID, WorkMode.ONSITE]
        employment = [EmploymentType.FULL_TIME, EmploymentType.FULL_TIME, EmploymentType.CONTRACT, EmploymentType.INTERNSHIP]
        for company_index, (name, industry, location, size) in enumerate(COMPANIES, start=1):
            owner = _get_user(db, f"hr{company_index}.demo@trackhire.local", f"Recruiter {company_index}", "Demo", UserRole.HR)
            company = db.scalar(select(Company).where(Company.name == name))
            if company is None:
                company = Company(name=name, owner_id=owner.id, description="", website="", location=location, logo_url="/company-placeholder.svg", industry=industry, company_size=size)
                db.add(company)
                db.flush()
            company.description = f"{name} builds practical, people-first products and invests in strong engineering teams."
            company.website = f"https://{name.lower().replace(' ', '')}.example"
            company.logo_url = "/company-placeholder.svg"
            company.location, company.industry, company.company_size = location, industry, size
            company.is_verified, company.is_active = True, True
            membership = db.scalar(select(CompanyMembership).where(CompanyMembership.company_id == company.id, CompanyMembership.user_id == owner.id))
            if membership is None:
                db.add(CompanyMembership(company_id=company.id, user_id=owner.id, role=MembershipRole.OWNER, is_active=True))
            companies.append((company, owner))

            for role_index, (title, skills, level) in enumerate(ROLES):
                job = db.scalar(select(Job).where(Job.company_id == company.id, Job.title == title))
                if job is None:
                    job = Job(title=title, description="", work_mode=modes[(company_index + role_index) % len(modes)], employment_type=employment[(company_index + role_index) % len(employment)], experience_level=level, min_experience=0, skills=[], status=JobStatus.PUBLISHED, company_id=company.id, created_by=owner.id)
                    db.add(job)
                job.description = f"Join {name} as a {title}. Own meaningful product work, collaborate with design and engineering, ship reliable solutions, review outcomes, and improve customer experience. Required strengths include {', '.join(skills)}."
                job.location = "Remote, India" if job.work_mode == WorkMode.REMOTE else location
                job.min_experience = 1 if level in {ExperienceLevel.ENTRY, ExperienceLevel.JUNIOR} else (3 if level == ExperienceLevel.MID else 5)
                job.max_experience = job.min_experience + 4
                job.min_salary, job.max_salary = 600000 + role_index * 180000, 1300000 + role_index * 180000
                job.skills = skills
                job.application_deadline = NOW + timedelta(days=20 + role_index)
                job.status, job.is_active = JobStatus.PUBLISHED, True
                job.published_at = NOW - timedelta(days=(company_index * 2 + role_index))
                jobs.append(job)

        db.flush()
        statuses = [ApplicationStatus.APPLIED, ApplicationStatus.SCREENING, ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW, ApplicationStatus.SELECTED, ApplicationStatus.REJECTED]
        for candidate_index, (candidate, resume) in enumerate(candidates):
            for offset in range(4):
                job = jobs[(candidate_index * 5 + offset * 3) % len(jobs)]
                application = db.scalar(select(Application).where(Application.job_id == job.id, Application.candidate_id == candidate.id))
                if application is None:
                    application = Application(job_id=job.id, candidate_id=candidate.id, resume_id=resume.id, cover_letter="I am excited to bring relevant experience and measurable impact to this team.")
                    db.add(application)
                application.status = statuses[(candidate_index + offset) % len(statuses)]
                application.recruiter_notes = "Demo application seeded for local product evaluation."
            for offset in range(3):
                job = jobs[(candidate_index * 7 + offset * 4) % len(jobs)]
                saved = db.scalar(select(SavedJob).where(SavedJob.candidate_id == candidate.id, SavedJob.job_id == job.id))
                if saved is None:
                    db.add(SavedJob(candidate_id=candidate.id, job_id=job.id))

        db.flush()
        interview_applications = list(db.scalars(select(Application).where(Application.status.in_([ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW])).limit(8)))
        for index, application in enumerate(interview_applications, start=1):
            interviewer = companies[index % len(companies)][1]
            interview = db.scalar(select(Interview).where(Interview.application_id == application.id, Interview.round_number == 1))
            if interview is None:
                db.add(Interview(application_id=application.id, interviewer_id=interviewer.id, interview_type=InterviewType.TECHNICAL, status=InterviewStatus.SCHEDULED, scheduled_at=NOW + timedelta(days=index), round_number=1, duration_minutes=60, meeting_url=f"https://meet.example/trackhire-demo-{index}", notes="Demo technical conversation."))

        db.commit()
        print(f"Seed complete: {len(companies)} companies, {len(jobs)} published jobs, {len(candidates)} candidates.")
        print("Candidate login: candidate1.demo@trackhire.local / DemoPass123!")
        print("Recruiter login: hr1.demo@trackhire.local / DemoPass123!")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
