from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.recommendation import RecommendRequest, RecommendResponse
from app.services.recommendation_service import RecommendationService, get_provider

router = APIRouter(tags=["recommendations"])


@router.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest, lang: str = "en", db: Session = Depends(get_db)):
    service = RecommendationService(db, get_provider())
    return service.recommend(request, lang=lang)
