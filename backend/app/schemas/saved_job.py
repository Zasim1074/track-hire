import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.job import JobResponse


class SavedJobResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    created_at: datetime
    job: JobResponse

    model_config = ConfigDict(from_attributes=True)
