from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.recommendation import (
    RecommendationFilters,
    RecommendResponse,
)
from app.services.pdf_analysis_service import PdfAnalysisService


router = APIRouter(tags=["pdf"])


@router.post(
    "/pdf/analyze",
    response_model=RecommendResponse,
)
async def analyze_pdf(
    file: UploadFile = File(...),
    status: str | None = None,
    department: str | None = None,
    aspect: str | None = None,
    lang: str = "en",
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="PDF filename is missing.",
        )

    try:
        file_bytes = await file.read()

        filters = RecommendationFilters(
            status=status,
            department=department,
            aspect=aspect,
        )

        service = PdfAnalysisService(db)

        return service.analyze(
            file_name=file.filename,
            file_bytes=file_bytes,
            filters=filters,
            lang=lang,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"PDF analysis failed: {exc}",
        ) from exc