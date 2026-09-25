import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
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


@router.post("/pdf/analyze/stream")
async def analyze_pdf_stream(
    file: UploadFile = File(...),
    status: str | None = None,
    department: str | None = None,
    aspect: str | None = None,
    lang: str = "en",
    db: Session = Depends(get_db),
):
    """Same analysis as /pdf/analyze, but streamed as newline-delimited JSON
    (NDJSON) so the client can render fast stages (page count, readable
    pages, word count, detected IS numbers/refs) immediately, then fill in
    the slower ML-driven recommendations and per-line-item matches as each
    one finishes, instead of one long blocking wait."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="PDF filename is missing.")

    file_name = file.filename
    file_bytes = await file.read()
    filters = RecommendationFilters(status=status, department=department, aspect=aspect)
    service = PdfAnalysisService(db)

    def event_stream():
        for event in service.analyze_stream(file_name=file_name, file_bytes=file_bytes, filters=filters, lang=lang):
            yield json.dumps(event, default=str) + "\n"

    return StreamingResponse(
        event_stream(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )