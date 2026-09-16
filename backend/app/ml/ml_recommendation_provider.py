from __future__ import annotations

import re
from pathlib import Path

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.standard import Standard
from app.schemas.recommendation import RecommendRequest

from app.ml.embedding_service import EmbeddingService
from app.ml.retrieval_service import RetrievalService
from app.ml.ranking_service import RankingService
from app.services.query_translation import translate_query_to_english


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
              ↓
        2D semantic similarity map
    """

    def __init__(
        self,
        model_name: str = "BAAI/bge-small-en-v1.5",
    ):
        base_dir = Path(__file__).resolve().parent

        artifact_dir = base_dir / "artifacts"

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

        # --------------------------------------------------
        # Stores the latest semantic-map coordinates.
        # --------------------------------------------------

        self.last_similarity_map = []

        print(
            "ML recommendation provider ready."
        )

    # ======================================================
    # BUILD SEMANTIC SIMILARITY MAP
    # ======================================================

    def build_similarity_map(
        self,
        query_embedding: list[float],
        retrieved_records: list[dict],
        standards_by_number: dict[str, Standard],
        top_k: int = 10,
    ) -> list[dict]:
        """
        Create a simple 2D semantic map using PCA.

        The query and the selected BIS standards are represented
        by their existing BGE embeddings. PCA reduces those
        embeddings to two dimensions for visualization.
        """

        selected = []

        seen_numbers = set()

        for record in retrieved_records:
            is_number = record.get(
                "is_number"
            )

            if not is_number:
                continue

            # Avoid duplicate standards.
            if is_number in seen_numbers:
                continue

            standard = standards_by_number.get(
                is_number
            )

            if standard is None:
                continue

            try:
                position = int(
                    record["_index_position"]
                )

                vector = (
                    self.retrieval_service.index.reconstruct(
                        position
                    )
                )

                selected.append(
                    {
                        "standard": standard,
                        "vector": np.asarray(
                            vector,
                            dtype=np.float32,
                        ),
                        "score": float(
                            record.get(
                                "similarity_score",
                                0.0,
                            )
                        ),
                    }
                )

                seen_numbers.add(
                    is_number
                )

            except Exception:
                continue

            if len(selected) >= top_k:
                break

        if not selected:
            return []

        # --------------------------------------------------
        # Query vector.
        # --------------------------------------------------

        query_vector = np.asarray(
            query_embedding,
            dtype=np.float32,
        )

        # --------------------------------------------------
        # Combine query + standard vectors.
        # --------------------------------------------------

        vectors = np.vstack(
            [
                query_vector,
                *[
                    item["vector"]
                    for item in selected
                ],
            ]
        )

        # --------------------------------------------------
        # Center the vectors.
        # --------------------------------------------------

        centered = (
            vectors
            - vectors.mean(
                axis=0,
                keepdims=True,
            )
        )

        # --------------------------------------------------
        # PCA using SVD.
        # --------------------------------------------------

        _, _, vt = np.linalg.svd(
            centered,
            full_matrices=False,
        )

        if vt.shape[0] < 2:
            return []

        # --------------------------------------------------
        # Convert to 2D coordinates.
        # --------------------------------------------------

        coordinates = (
            centered @ vt[:2].T
        )

        # --------------------------------------------------
        # Normalize coordinates to roughly -1 to +1.
        # --------------------------------------------------

        scale = np.max(
            np.abs(coordinates)
        )

        if scale > 0:
            coordinates = (
                coordinates / scale
            )

        # --------------------------------------------------
        # Query point.
        # --------------------------------------------------

        points = [
            {
                "standard_id": 0,
                "is_number": "QUERY",
                "title": "Your Query",
                "x": float(
                    coordinates[0][0]
                ),
                "y": float(
                    coordinates[0][1]
                ),
                "score": 1.0,
                "is_query": True,
            }
        ]

        # --------------------------------------------------
        # BIS standard points.
        # --------------------------------------------------

        for index, item in enumerate(
            selected,
            start=1,
        ):
            standard = item[
                "standard"
            ]

            points.append(
                {
                    "standard_id": standard.id,
                    "is_number": standard.is_number,
                    "title": standard.title,
                    "x": float(
                        coordinates[index][0]
                    ),
                    "y": float(
                        coordinates[index][1]
                    ),
                    "score": item["score"],
                    "is_query": False,
                }
            )

        return points

    # ======================================================
    # RECOMMEND
    # ======================================================

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

        # Clear previous map before every request.
        self.last_similarity_map = []

        query = request.query.strip()

        if not query:
            return []

        # ==================================================
        # 0. QUERY TRANSLATION  (non-English → English)
        # ==================================================
        # If the query contains Devanagari / Tamil / Bengali / etc. characters,
        # translate it to English before embedding so that the BGE English
        # model can match it against the standards corpus correctly.
        # translate_query_to_english() is a no-op for Latin-script queries, so
        # there is zero overhead on normal English searches.

        query = translate_query_to_english(query)

        # ==================================================
        # 1. EMBEDDING
        # ==================================================

        query_embedding = (
            self.embedding_service.embed(
                query
            )
        )

        print(
            "DEBUG:Query embedding generated."
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

        print(
            f"DEBUG: FAISS retrieval completed: "
            f"{len(retrieved)} results"
        )

        if not retrieved:
            return []

        # ==================================================
        # 3. DEDUPLICATE BY IS NUMBER
        # ==================================================

        unique_records = {}
        unique_order = []

        for record in retrieved:

            is_number = record.get(
                "is_number"
            )

            if not is_number:
                continue

            if (
                is_number
                not in unique_records
            ):
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
                Standard.department_name
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

        print(
            f"DEBUG: DB lookup completed: "
            f"{len(standards)} standards"
        )

        # --------------------------------------------------
        # Map standards by IS number.
        # --------------------------------------------------

        standards_by_number = {
            standard.is_number: standard
            for standard in standards
        }

        if not standards_by_number:
            return []

        # ==================================================
        # 5. BUILD SEMANTIC MAP
        # ==================================================

        self.last_similarity_map = (
            self.build_similarity_map(
                query_embedding=query_embedding,
                retrieved_records=retrieved,
                standards_by_number=(
                    standards_by_number
                ),
                top_k=settings.max_recommendations,
            )
        )

        print(
            "DEBUG: semantic similarity map "
            f"created: {len(self.last_similarity_map)} points"
        )

        # ==================================================
        # 6. BUILD RANKING CANDIDATES
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
        # 7. RANK
        # ==================================================

        ranked = (
            self.ranking_service.rank(
                query=query,
                candidates=ranking_candidates,
                top_k=settings.max_recommendations,
            )
        )

        print(
            f"DEBUG: ranking completed: "
            f"{len(ranked)} results"
        )

        # ==================================================
        # 8. CONVERT TO EXISTING API CONTRACT
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
            # Match explicit requirements.
            # ----------------------------------------------

            matched_requirements = []

            for requirement in (
                standard.requirements
                or []
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
            # Explainability.
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