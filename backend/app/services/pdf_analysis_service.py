from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader
from sqlalchemy.orm import Session
from app.schemas.recommendation import (
    RecommendationFilters,
    RecommendRequest,
    RecommendResponse,
)
from app.services.recommendation_service import (
    RecommendationService,
    get_provider,
)


MAX_PDF_SIZE = 20 * 1024 * 1024
MAX_QUERY_CHARS = 12000


class PdfAnalysisService:
    """
    Extract text from an uploaded PDF and run it through the
    existing BIS ML recommendation pipeline.
    """

    def __init__(self, db: Session):
        self.db = db

    def analyze( 
        self,
        file_name: str,
        file_bytes: bytes,
        filters: RecommendationFilters,
        lang: str = "en",
    ) -> RecommendResponse:
        self._validate_file(file_name, file_bytes)

        extracted_text = self._extract_text(file_bytes)

        query = self._build_query(extracted_text)

        if not query:
            raise ValueError(
                "No readable text could be extracted from the PDF."
            )

        request = RecommendRequest(
            query=query,
            document_name=file_name,
            filters=filters,
        )

        service = RecommendationService(
            self.db,
            get_provider(),
        )

        return service.recommend(
            request,
            lang=lang,
        )

    @staticmethod
    def _validate_file(
        file_name: str,
        file_bytes: bytes,
    ) -> None:
        if not file_name.lower().endswith(".pdf"):
            raise ValueError("Only PDF files are accepted.")

        if not file_bytes:
            raise ValueError("The uploaded PDF is empty.")

        if len(file_bytes) > MAX_PDF_SIZE:
            raise ValueError(
                "PDF is too large. Maximum allowed size is 20 MB."
            )

        if not file_bytes.startswith(b"%PDF"):
            raise ValueError(
                "The uploaded file is not a valid PDF."
            )

    @staticmethod
    def _extract_text(file_bytes: bytes) -> str:
        reader = PdfReader(BytesIO(file_bytes))

        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception as exc:
                raise ValueError(
                    "Encrypted PDFs are not supported."
                ) from exc

        pages: list[str] = []

        for page in reader.pages:
            text = page.extract_text() or ""

            if text.strip():
                pages.append(text.strip())

        return "\n\n".join(pages)

    @staticmethod
    def _build_query(text: str) -> str:
        """
        Keep the database/recommendation query bounded.

        We keep both the beginning and end so that important
        specification details near the end are not always lost.
        """

        cleaned = " ".join(text.split())

        if len(cleaned) <= MAX_QUERY_CHARS:
            return cleaned

        head_size = MAX_QUERY_CHARS * 2 // 3
        tail_size = MAX_QUERY_CHARS - head_size

        return (
            cleaned[:head_size]
            + "\n\n[PDF CONTENT TRUNCATED]\n\n"
            + cleaned[-tail_size:]
        )