from __future__ import annotations

import re
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.standard import Standard
from app.schemas.recommendation import RecommendRequest

from app.ml.embedding_service import EmbeddingService
from app.ml.retrieval_service import RetrievalService
from app.ml.ranking_service import RankingService


_STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "have",
    "from",
    "must",
    "shall",
    "will",
    "need",
    "want",
    "should",
    "our",
    "are",
    "used",
    "use",
    "per",
    "any",
    "all",
    "not",
    "but",
    "can",
    "may",
    "into",
    "than",
    "then",
    "them",
    "a",
    "an",
    "of",
    "to",
    "in",
    "on",
    "at",
    "is",
    "it",
    "we",
    "be",
    "as",
    "or",
}


def tokenize(text: str) -> set[str]:
    words = re.findall(
        r"[a-z0-9]+",
        (text or "").lower(),
    )

    return {
        word
        for word in words
        if len(word) > 2
        and word not in _STOPWORDS
    }


class MLRecommendationProvider:
    """
    Production-facing ML recommendation provider.

    Pipeline:

        Procurement query
              ↓
        BGE embedding
              ↓
        FAISS retrieval
              ↓
        Deduplication
              ↓
        PostgreSQL validation/filtering
              ↓
        Ranking
              ↓
        Top recommendations
    """

    def __init__(
        self,
        model_name: str = "BAAI/bge-small-en-v1.5",
    ):

        base_dir = Path(__file__).resolve().parent

        artifact_dir = (
            base_dir / "artifacts"
        )

        index_path = (
            artifact_dir / "standards.index"
        )

        metadata_path = (
            artifact_dir / "standards.pkl"
        )

        print(
            "Initializing ML recommendation provider..."
        )

        # --------------------------------------------------
        # Load BGE once.
        # --------------------------------------------------

        self.embedding_service = (
            EmbeddingService(
                model_name=model_name
            )
        )

        # --------------------------------------------------
        # Load FAISS once.
        # --------------------------------------------------

        self.retrieval_service = (
            RetrievalService(
                index_path=index_path,
                metadata_path=metadata_path,
            )
        )

        # --------------------------------------------------
        # Ranking service.
        # --------------------------------------------------

        self.ranking_service = (
            RankingService()
        )

        # --------------------------------------------------
        # Retrieve more candidates than we finally return.
        #
        # This gives filtering/deduplication room.
        # --------------------------------------------------

        self.retrieval_k = max(
            200,
            settings.max_recommendations * 20,
        )

        print(
            "ML recommendation provider ready."
        )

    def recommend(
        self,
        request: RecommendRequest,
        db: Session,
        candidates: list[Standard] | None = None,
    ) -> list[
        tuple[
            Standard,
            float,
            list[str],
            str,
        ]
    ]:

        query = request.query.strip()

        if not query:
            return []

        # ==================================================
        # 1. EMBEDDING
        # ==================================================

        query_embedding = (
            self.embedding_service.embed(
                query
            )
        )

        # ==================================================
        # 2. FAISS RETRIEVAL
        # ==================================================

        retrieved = (
            self.retrieval_service.retrieve(
                query_embedding=query_embedding,
                top_k=self.retrieval_k,
            )
        )

        if not retrieved:
            return []

        # ==================================================
        # 3. DEDUPLICATE BY IS NUMBER
        # ==================================================

        #
        # Your test showed duplicate records:
        #
        # IS 8112:2013
        # IS 8042:1989
        #
        # appearing multiple times.
        #
        # For procurement recommendations, the same
        # standard number should not occupy multiple slots.
        #

        unique_records = {}
        unique_order = []

        for record in retrieved:

            is_number = (
                record.get("is_number")
            )

            if not is_number:
                continue

            if is_number not in unique_records:

                unique_records[
                    is_number
                ] = record

                unique_order.append(
                    is_number
                )

        # ==================================================
        # 4. LOAD AUTHORITATIVE DB RECORDS
        # ==================================================

        is_numbers = list(
            unique_records.keys()
        )

        if not is_numbers:
            return []

        stmt = select(Standard).where(
            Standard.is_number.in_(
                is_numbers
            )
        )

        # --------------------------------------------------
        # Status filtering
        # --------------------------------------------------
        #
        # For procurement:
        #
        # no explicit status → Active only
        #
        # explicit status → respect user's filter
        #

        requested_status = (
            request.filters.status
        )

        if requested_status:
            stmt = stmt.where(
                Standard.status
                == requested_status
            )
        else:
            stmt = stmt.where(
                Standard.status
                == "Active"
            )

        # --------------------------------------------------
        # Department filtering
        # --------------------------------------------------

        if request.filters.department:

            stmt = stmt.where(
                Standard.department
                == request.filters.department
            )

        # --------------------------------------------------
        # Aspect filtering
        # --------------------------------------------------

        if request.filters.aspect:

            stmt = stmt.where(
                Standard.aspect
                == request.filters.aspect
            )

        standards = list(
            db.scalars(stmt).all()
        )

        # --------------------------------------------------
        # Map database standards by IS number.
        # --------------------------------------------------

        standards_by_number = {
            standard.is_number: standard
            for standard in standards
        }

        if not standards_by_number:
            return []

        # ==================================================
        # 5. BUILD RANKING CANDIDATES
        # ==================================================

        ranking_candidates = []

        for is_number in unique_order:

            record = unique_records[
                is_number
            ]

            standard = (
                standards_by_number.get(
                    is_number
                )
            )

            if standard is None:
                continue

            ranking_candidates.append(
                {
                    "is_number": is_number,
                    "is_title": standard.title,
                    "status": standard.status,
                    "similarity_score": float(
                        record.get(
                            "similarity_score",
                            0.0,
                        )
                    ),
                    "_standard": standard,
                }
            )

        # ==================================================
        # 6. RANK
        # ==================================================

        ranked = (
            self.ranking_service.rank(
                query=query,
                candidates=ranking_candidates,
                top_k=settings.max_recommendations,
            )
        )

        # ==================================================
        # 7. CONVERT TO EXISTING API CONTRACT
        # ==================================================

        results = []

        query_terms = tokenize(query)

        for ranked_record in ranked:

            standard = ranked_record[
                "_standard"
            ]

            similarity = float(
                ranked_record[
                    "similarity_score"
                ]
            )

            final_score = float(
                ranked_record[
                    "final_score"
                ]
            )

            # ----------------------------------------------
            # Match explicit requirements where possible.
            # ----------------------------------------------

            matched_requirements = []

            for requirement in (
                standard.requirements or []
            ):

                if (
                    query_terms
                    & tokenize(requirement)
                ):
                    matched_requirements.append(
                        requirement
                    )

            matched_requirements = (
                matched_requirements[:5]
            )

            # ----------------------------------------------
            # Explainability
            # ----------------------------------------------

            reason = (
                f"{standard.is_number} "
                f"retrieved by semantic similarity "
                f"to the procurement specification "
                f"(similarity {similarity:.3f})."
            )

            if matched_requirements:

                reason += (
                    " The query also overlaps "
                    f"{len(matched_requirements)} "
                    "stored requirement(s)."
                )

            results.append(
                (
                    standard,
                    final_score,
                    matched_requirements,
                    reason,
                )
            )

        return results