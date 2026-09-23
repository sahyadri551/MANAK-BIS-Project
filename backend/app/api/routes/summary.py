from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.summary import SummaryRequest, SummaryResponse
from app.services.summary_service import SummaryService

router = APIRouter(tags=["summary"])


@router.post("/summary", response_model=SummaryResponse)
def summarize(request: SummaryRequest, db: Session = Depends(get_db)):
    return SummaryService(db).summarize(request)