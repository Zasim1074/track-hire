from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    test_database_url: str | None = None
    algorithm: str
    secret_key: str
    access_token_expire_minutes: int
    supabase_url: str | None = None
    supabase_secret_key: str | None = None
    supabase_bucket_name: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
