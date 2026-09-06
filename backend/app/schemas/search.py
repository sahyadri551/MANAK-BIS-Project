from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.recommendation import RecommendationFilters


class SearchHistoryEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: str
    query: str
    document_name: str | None = None
    filters: RecommendationFilters = RecommendationFilters()
    result_count: int
    created_at: datetime
