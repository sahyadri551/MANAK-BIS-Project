from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict( env_file=".env", extra="ignore",)
    app_name: str = "BIS Standard Recommender"
    api_prefix: str = "/api"
    database_url: str =""
    cors_origins: str = "*"
    recommendation_provider: str = "ml"
    max_recommendations: int = 10
    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()