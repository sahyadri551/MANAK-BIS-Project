from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "BIS Standard Recommender"
    api_prefix: str = "/api"
    database_url: str = "postgresql://neondb_owner:npg_a6uIxkUm5pPN@ep-restless-hall-ayl6rndh-pooler.c-5.us-east-2.aws.neon.tech/bis?sslmode=require&channel_binding=require"
    cors_origins: str = "*"
    recommendation_provider: str = "ml"
    max_recommendations: int = 10
    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
