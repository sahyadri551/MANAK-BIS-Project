from __future__ import annotations

import re
from io import BytesIO
from typing import Any, Generator

from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.schemas.recommendation import (
    PdfAnalysisSummary,
    PdfLineItem,
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

# Matches the start of a new tender line item: "1.", "1)", "(1)", "Item 1",
# "Item No. 1", "S.No 1", "Sl. No. 1" — the common ways BOQs/tender specs
# number their rows.
ITEM_START_RE = re.compile(
    r"^\s*(?:"
    r"(\d{1,3})\s*[.)]\s+"
    r"|item\s*(?:no\.?)?\s*[:\-]?\s*(\d{1,3})\b"
    r"|s(?:l)?\.?\s*no\.?\s*[:\-]?\s*(\d{1,3})\b"
    r")",
    re.I,
)
MAX_LINE_ITEMS = 20          # cap so one huge tender doesn't trigger 100+ embedding calls
MIN_LINE_ITEM_CHARS = 20     # discard numbered fragments too short to be a real requirement
MAX_LINE_ITEM_CHARS = 800    # trim very long "items" (likely mis-split section text)
LINE_ITEM_RECS_PER_ITEM = 3


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
        rec_service = RecommendationService(self.db, get_provider())
        request = RecommendRequest(query=query, document_name=history_name, filters=filters)
        response = rec_service.recommend(request, lang=lang)
        response.pdf_analysis = summary
        response.line_items = self._recommend_line_items(extracted_text, filters, lang, rec_service)
        return response

    def analyze_stream(
        self,
        file_name: str,
        file_bytes: bytes,
        filters: RecommendationFilters,
        lang: str = "en",
    ) -> Generator[dict[str, Any], None, None]:
        """Same pipeline as analyze(), but yields progress events as each
        cheap/fast stage finishes instead of making the caller wait for the
        whole (slow, ML-heavy) pipeline. Stage order:
          1. "summary"        - page count, readable pages, word count,
                                 detected IS numbers/sections/refs (near-instant,
                                 pure text/regex work, no ML calls)
          2. "recommendations" - whole-document semantic match + similarity map
          3. "line_item"       - emitted once per tender/BOQ line item as its
                                 own recommendation finishes (these are the
                                 slow, one-embedding-call-per-item part)
          4. "done"            - final event, carries the full RecommendResponse
                                 shape for consumers that want it in one piece
          5. "error"           - only on failure, terminates the stream
        """
        try:
            self._validate_file(file_name, file_bytes)
            reader, page_texts = self._extract_pages(file_bytes)
            summary = self._build_summary(file_name, reader, page_texts)
            yield {"stage": "summary", "data": summary.model_dump()}

            extracted_text = "\n\n".join(text for text in page_texts if text.strip())
            query = self._build_query(extracted_text, summary)
            if not query:
                raise ValueError(
                    "No readable text could be extracted from the PDF. Try a text-based PDF instead of a scanned image-only file."
                )

            history_name = summary.document_title or file_name
            rec_service = RecommendationService(self.db, get_provider())
            request = RecommendRequest(query=query, document_name=history_name, filters=filters)
            response = rec_service.recommend(request, lang=lang)
            response.pdf_analysis = summary
            yield {
                "stage": "recommendations",
                "data": {
                    "request_id": response.request_id,
                    "recommendations": [r.model_dump() for r in response.recommendations],
                    "similarity_map": [p.model_dump() for p in response.similarity_map],
                },
            }

            line_items: list[PdfLineItem] = []
            item_texts = self._split_line_items(extracted_text)
            if len(item_texts) >= 2:
                for idx, item_text in enumerate(item_texts, start=1):
                    item_request = RecommendRequest(query=item_text, filters=filters)
                    try:
                        item_response = rec_service.recommend(item_request, lang=lang, record=False)
                    except Exception:
                        continue  # one bad item shouldn't fail the whole PDF analysis
                    item = PdfLineItem(
                        item_number=idx,
                        text=item_text,
                        recommendations=item_response.recommendations[:LINE_ITEM_RECS_PER_ITEM],
                    )
                    line_items.append(item)
                    yield {
                        "stage": "line_item",
                        "data": item.model_dump(),
                        "progress": {"completed": idx, "total": len(item_texts)},
                    }

            response.line_items = line_items
            yield {"stage": "done", "data": response.model_dump()}
        except ValueError as exc:
            yield {"stage": "error", "message": str(exc)}
        except Exception as exc:  # pragma: no cover - defensive
            yield {"stage": "error", "message": f"PDF analysis failed: {exc}"}

    @staticmethod
    def _split_line_items(text: str) -> list[str]:
        """Split extracted tender/spec text into individual numbered
        requirement items, e.g. '1. Cement shall conform to...', '2) Steel
        reinforcement bars...'. Lines belonging to the same item (wrapped
        text) are joined until the next item marker starts."""
        items: list[str] = []
        current: list[str] = []

        def flush() -> None:
            if not current:
                return
            joined = " ".join(" ".join(current).split())
            if len(joined) >= MIN_LINE_ITEM_CHARS:
                items.append(joined[:MAX_LINE_ITEM_CHARS])

        for line in text.splitlines():
            if ITEM_START_RE.match(line.strip()):
                flush()
                current = [line]
            elif current:
                current.append(line)
        flush()
        return items[:MAX_LINE_ITEMS]

    def _recommend_line_items(
        self,
        extracted_text: str,
        filters: RecommendationFilters,
        lang: str,
        rec_service: RecommendationService,
    ) -> list[PdfLineItem]:
        """Run a separate, lighter recommendation pass per detected line
        item, so a procurement officer gets a standard suggestion for each
        individual requirement/BOQ row, not just one match for the whole
        document. Only runs when the document actually looks itemized
        (2+ numbered entries) to avoid wasted embedding calls on prose
        documents that already get a good whole-document match."""
        item_texts = self._split_line_items(extracted_text)
        if len(item_texts) < 2:
            return []

        line_items: list[PdfLineItem] = []
        for idx, item_text in enumerate(item_texts, start=1):
            item_request = RecommendRequest(query=item_text, filters=filters)
            try:
                item_response = rec_service.recommend(item_request, lang=lang, record=False)
            except Exception:
                continue  # one bad item shouldn't fail the whole PDF analysis
            line_items.append(
                PdfLineItem(
                    item_number=idx,
                    text=item_text,
                    recommendations=item_response.recommendations[:LINE_ITEM_RECS_PER_ITEM],
                )
            )
        return line_items

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
