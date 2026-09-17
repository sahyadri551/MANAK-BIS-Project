from __future__ import annotations

import re
from io import BytesIO

from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.schemas.recommendation import (
    PdfAnalysisSummary,
    PdfPageSummary,
    RecommendationFilters,
    RecommendRequest,
    RecommendResponse,
)
from app.services.recommendation_service import RecommendationService, get_provider

MAX_PDF_SIZE = 20 * 1024 * 1024
MAX_QUERY_CHARS = 12000
IS_NUMBER_RE = re.compile(r"\bIS\s*[:\-]?\s*\d{2,6}(?:\s*\([^\n]{1,80}\))?(?:\s*[:\-]\s*\d{4})?", re.I)
SECTION_RE = re.compile(r"\b(1\s+scope|2\s+references?|3\s+terms\s+and\s+definitions|4\s+requirements?|5\s+sampling|6\s+methods?\s+of\s+test|7\s+marking|8\s+packing|9\s+inspection|annex\s+[a-z])\b", re.I)
REFERENCE_RE = re.compile(r"\bIS\s*\d{2,6}(?:\s*\([^\n]{1,80}\))?(?:\s*[:\-]\s*\d{4})?", re.I)


class PdfAnalysisService:
    """Extract, profile and semantically analyze an uploaded BIS PDF."""

    def __init__(self, db: Session):
        self.db = db

    def analyze(self, file_name: str, file_bytes: bytes, filters: RecommendationFilters, lang: str = "en") -> RecommendResponse:
        self._validate_file(file_name, file_bytes)
        reader, page_texts = self._extract_pages(file_bytes)
        summary = self._build_summary(file_name, reader, page_texts)
        extracted_text = "\n\n".join(text for text in page_texts if text.strip())
        query = self._build_query(extracted_text, summary)
        if not query:
            raise ValueError("No readable text could be extracted from the PDF. Try a text-based PDF instead of a scanned image-only file.")

        history_name = summary.document_title or file_name
        request = RecommendRequest(query=query, document_name=history_name, filters=filters)
        response = RecommendationService(self.db, get_provider()).recommend(request, lang=lang)
        response.pdf_analysis = summary
        return response

    @staticmethod
    def _validate_file(file_name: str, file_bytes: bytes) -> None:
        if not file_name.lower().endswith(".pdf"):
            raise ValueError("Only PDF files are accepted.")
        if not file_bytes:
            raise ValueError("The uploaded PDF is empty.")
        if len(file_bytes) > MAX_PDF_SIZE:
            raise ValueError("PDF is too large. Maximum allowed size is 20 MB.")
        if not file_bytes.startswith(b"%PDF"):
            raise ValueError("The uploaded file is not a valid PDF.")

    @staticmethod
    def _extract_pages(file_bytes: bytes) -> tuple[PdfReader, list[str]]:
        reader = PdfReader(BytesIO(file_bytes))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception as exc:
                raise ValueError("Encrypted PDFs are not supported.") from exc
        return reader, [(page.extract_text() or "").strip() for page in reader.pages]

    @classmethod
    def _build_summary(cls, file_name: str, reader: PdfReader, page_texts: list[str]) -> PdfAnalysisSummary:
        metadata = reader.metadata or {}
        combined = "\n".join(page_texts)
        normalized = " ".join(combined.split())
        readable = sum(bool(text.strip()) for text in page_texts)
        warnings: list[str] = []
        if readable < len(page_texts):
            warnings.append(f"{len(page_texts) - readable} page(s) contained no extractable text.")
        if not normalized:
            warnings.append("No text layer was detected; OCR may be required for this document.")
        elif len(normalized) < 300:
            warnings.append("Very little text was extracted; semantic matching may be limited.")

        title = str(metadata.get("/Title") or "").strip() or None
        subject = str(metadata.get("/Subject") or "").strip() or None
        pages = [PdfPageSummary(page=i + 1, characters=len(text), preview=" ".join(text.split())[:220]) for i, text in enumerate(page_texts) if text.strip()]
        return PdfAnalysisSummary(
            file_name=file_name,
            page_count=len(page_texts),
            readable_pages=readable,
            character_count=len(normalized),
            word_count=len(normalized.split()),
            detected_is_numbers=cls._unique_matches(IS_NUMBER_RE, normalized),
            detected_sections=cls._unique_matches(SECTION_RE, normalized),
            detected_references=cls._unique_matches(REFERENCE_RE, normalized),
            document_title=title,
            document_subject=subject,
            pages=pages,
            extraction_warnings=warnings,
        )

    @staticmethod
    def _unique_matches(pattern: re.Pattern[str], text: str) -> list[str]:
        seen: set[str] = set()
        values: list[str] = []
        for match in pattern.findall(text):
            value = " ".join(match.split()).strip()
            if value.lower() not in seen:
                seen.add(value.lower())
                values.append(value)
        return values[:50]

    @staticmethod
    def _build_query(text: str, summary: PdfAnalysisSummary) -> str:
        cleaned = " ".join(text.split())
        context = [
            f"Document title: {summary.document_title}" if summary.document_title else "",
            f"Detected BIS standards: {', '.join(summary.detected_is_numbers)}" if summary.detected_is_numbers else "",
            f"Detected sections: {', '.join(summary.detected_sections)}" if summary.detected_sections else "",
            cleaned,
        ]
        enriched = "\n\n".join(part for part in context if part)
        if len(enriched) <= MAX_QUERY_CHARS:
            return enriched
        head_size = MAX_QUERY_CHARS * 2 // 3
        tail_size = MAX_QUERY_CHARS - head_size
        return enriched[:head_size] + "\n\n[PDF CONTENT TRUNCATED — key references and document metadata retained above]\n\n" + enriched[-tail_size:]
