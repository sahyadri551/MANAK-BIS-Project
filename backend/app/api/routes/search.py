from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.search import SearchHistoryEntry
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/history", response_model=list[SearchHistoryEntry])
def history(limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    return SearchService(db).history(limit=limit)


@router.get("/history/count")
def history_count(hours: int | None = Query(None, gt=0), db: Session = Depends(get_db)):
    service = SearchService(db)
    if hours is not None:
        return {"total": service.count_since(hours=hours)}
    return {"total": service.count()}