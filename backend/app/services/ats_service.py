import io
import re
import zipfile
from collections import Counter
from xml.etree import ElementTree
from uuid import UUID

from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, JobNotFoundError, ResumeNotFoundError
from app.core.storage import download_resume
from app.models.job import JobStatus
from app.models.user import User, UserRole
from app.repositories.job_repository import get_job_by_id
from app.repositories.resume_repository import get_default
from app.schemas.ats import AtsResumeSummary, AtsScoreResponse


STOP_WORDS = {
    "about", "after", "also", "and", "are", "because", "been", "being", "build",
    "candidate", "company", "experience", "from", "have", "into", "job", "more",
    "must", "our", "role", "should", "team", "that", "the", "their", "they", "this",
    "using", "with", "will", "work", "years", "you", "your",
}


def _normalize(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9+#.]+", value.lower()))


def _tokens(value: str) -> list[str]:
    return [token for token in _normalize(value).split() if len(token) > 2 and token not in STOP_WORDS]


def _extract_pdf(contents: bytes) -> str:
    reader = PdfReader(io.BytesIO(contents))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_docx(contents: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(contents)) as archive:
        document = archive.read("word/document.xml")
    root = ElementTree.fromstring(document)
    return " ".join(node.text or "" for node in root.iter() if node.tag.endswith("}t"))


def _read_resume_text(file_name: str, contents: bytes) -> str:
    extension = file_name.rsplit(".", 1)[-1].lower()
    if extension == "pdf":
        return _extract_pdf(contents)
    if extension == "docx":
        return _extract_docx(contents)
    return " ".join(part.decode("latin-1", errors="ignore") for part in re.findall(rb"[ -~]{4,}", contents))


def _label(score: int) -> str:
    if score >= 80:
        return "Strong match"
    if score >= 60:
        return "Good match"
    if score >= 40:
        return "Fair match"
    return "Needs tailoring"


def _calculate(job, resume_text: str, resume) -> AtsScoreResponse:
    normalized_resume = _normalize(resume_text)
    required_skills = list(dict.fromkeys(skill.strip() for skill in job.skills if skill.strip()))
    matched_skills = [skill for skill in required_skills if _normalize(skill) in normalized_resume]
    missing_skills = [skill for skill in required_skills if skill not in matched_skills]

    frequencies = Counter(_tokens(f"{job.title} {job.description}"))
    job_keywords = [word for word, _ in frequencies.most_common(16)]
    resume_tokens = set(_tokens(resume_text))
    matched_keywords = [word for word in job_keywords if word in resume_tokens][:8]

    skill_score = (len(matched_skills) / len(required_skills) * 65) if required_skills else 45
    keyword_score = (len(matched_keywords) / len(job_keywords) * 25) if job_keywords else 15
    years = [int(value) for value in re.findall(r"(\d{1,2})\+?\s*(?:years?|yrs?)", normalized_resume)]
    experience_score = 10 if years and max(years) >= (job.min_experience or 0) else (5 if not job.min_experience else 0)
    score = max(0, min(100, round(skill_score + keyword_score + experience_score)))

    recommendations = []
    if missing_skills:
        recommendations.append(f"Show evidence for {', '.join(missing_skills[:3])} if you have used them.")
    if len(matched_keywords) < 4:
        recommendations.append("Mirror the job description's terminology in relevant achievement bullets.")
    if experience_score == 0:
        recommendations.append(f"Make your {job.min_experience}+ years of relevant experience easy to find.")
    if not recommendations:
        recommendations.append("Your resume is well aligned; quantify impact in your strongest matching achievements.")

    return AtsScoreResponse(
        score=score,
        label=_label(score),
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        matched_keywords=matched_keywords,
        recommendations=recommendations,
        resume=AtsResumeSummary(id=resume.id, file_name=resume.file_name),
    )


async def score_default_resume(db: Session, job_id: UUID, current_user: User) -> AtsScoreResponse:
    if current_user.role != UserRole.CANDIDATE:
        raise ForbiddenError
    job = get_job_by_id(db, job_id)
    if job is None or not job.is_active or job.status != JobStatus.PUBLISHED:
        raise JobNotFoundError
    resume = get_default(db, current_user.id)
    if resume is None:
        raise ResumeNotFoundError

    body = await download_resume(resume.file_url)
    try:
        contents = body.read()
    finally:
        body.close()
    return _calculate(job, _read_resume_text(resume.file_name, contents), resume)
