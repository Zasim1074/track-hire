from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    test_database_url: str | None = None
    algorithm: str
    secret_key: str
    access_token_expire_minutes: int
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    resume_storage_path: Path = Path("storage")
    environment: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_production_secrets(self):
        if self.environment.lower() == "production" and (
            len(self.secret_key) < 32 or self.secret_key.startswith("replace-")
        ):
            raise ValueError("Production SECRET_KEY must be a random value of at least 32 characters.")
        return self


settings = Settings()
