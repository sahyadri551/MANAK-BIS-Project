from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db.models.search_history import SearchHistory
from app.schemas.recommendation import RecommendRequest
from app.schemas.search import SearchHistoryEntry


class SearchService:
    def __init__(self, db: Session):
        self.db = db

    def record(self, request_id: str, request: RecommendRequest, result_count: int) -> None:
        entry = SearchHistory(
            request_id=request_id,
            query=request.query,
            document_name=request.document_name,
            filters=request.filters.model_dump(),
            result_count=result_count,
        )
        self.db.add(entry)
        self.db.commit()

    def history(self, limit: int = 50) -> list[SearchHistoryEntry]:
        stmt = select(SearchHistory).order_by(desc(SearchHistory.created_at)).limit(limit)
        rows = self.db.execute(stmt).scalars().all()
        return [SearchHistoryEntry.model_validate(row) for row in rows]

    def count(self) -> int:
        return self.db.execute(select(func.count(SearchHistory.id))).scalar_one()