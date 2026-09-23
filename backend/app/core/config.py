from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict( env_file=".env", extra="ignore",)
    app_name: str = "BIS Standard Recommender"
    api_prefix: str = "/api"
    database_url: str =""
    cors_origins: str = "*"
    recommendation_provider: str = "ml"
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    max_recommendations: int = 10
    log_level: str = "INFO"
    # Translation model used by query_translation.py
    # Any litellm-compatible model string works, e.g.:
    #   gemini/gemini-1.5-flash  (free tier, default)
    #   openai/gpt-4o-mini
    translation_model: str = "gemini/gemini-1.5-flash"
    llm_model: str = ""
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