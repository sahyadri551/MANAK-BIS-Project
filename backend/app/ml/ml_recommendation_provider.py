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
    "the", "and", "for", "with", "that", "this", "have", "from", "must",
    "shall", "will", "need", "want", "should", "our", "are", "used", "use",
    "per", "any", "all", "not", "but", "can", "may", "into", "than", "then",
    "them", "a", "an", "of", "to", "in", "on", "at", "is", "it", "we", "be",
    "as", "or",
}


def tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {word for word in words if len(word) > 2 and word not in _STOPWORDS}


class MLRecommendationProvider:
    """Generate recommendations using embeddings, FAISS retrieval and ranking."""

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        base_dir = Path(__file__).resolve().parent
        artifact_dir = base_dir / "artifacts"
        self.embedding_service = EmbeddingService(model_name=model_name)
        self.retrieval_service = RetrievalService(
            index_path=artifact_dir / "standards.index",
            metadata_path=artifact_dir / "standards.pkl",
        )
        self.ranking_service = RankingService()
        self.retrieval_k = max(200, settings.max_recommendations * 20)
        self.last_similarity_map: list[dict] = []

    def build_similarity_map(
        self,
        query_embedding: list[float],
        retrieved_records: list[dict],
        standards_by_number: dict[str, Standard],
        top_k: int = 10,
    ) -> list[dict]:
        selected = []
        seen_numbers = set()

        for record in retrieved_records:
            is_number = record.get("is_number")
            if not is_number or is_number in seen_numbers:
                continue

            standard = standards_by_number.get(is_number)
            if standard is None:
                continue

            try:
                position = int(record["_index_position"])
                vector = self.retrieval_service.index.reconstruct(position)
            except Exception:
                continue

            selected.append(
                {
                    "standard": standard,
                    "vector": np.asarray(vector, dtype=np.float32),
                    "score": float(record.get("similarity_score", 0.0)),
                }
            )
            seen_numbers.add(is_number)

            if len(selected) >= top_k:
                break

        if not selected:
            return []

        vectors = np.vstack(
            [np.asarray(query_embedding, dtype=np.float32)]
            + [item["vector"] for item in selected]
        )
        centered = vectors - vectors.mean(axis=0, keepdims=True)
        _, _, vt = np.linalg.svd(centered, full_matrices=False)

        if vt.shape[0] < 2:
            return []

        coordinates = centered @ vt[:2].T
        scale = np.max(np.abs(coordinates))
        if scale > 0:
            coordinates = coordinates / scale

        points = [
            {
                "standard_id": 0,
                "is_number": "QUERY",
                "title": "Your Query",
                "x": float(coordinates[0][0]),
                "y": float(coordinates[0][1]),
                "score": 1.0,
                "is_query": True,
            }
        ]

        for index, item in enumerate(selected, start=1):
            standard = item["standard"]
            points.append(
                {
                    "standard_id": standard.id,
                    "is_number": standard.is_number,
                    "title": standard.title,
                    "x": float(coordinates[index][0]),
                    "y": float(coordinates[index][1]),
                    "score": item["score"],
                    "is_query": False,
                }
            )

        return points

    def recommend(
        self,
        request: RecommendRequest,
        db: Session,
        candidates: list[Standard] | None = None,
    ) -> list[tuple[Standard, float, list[str], str]]:
        self.last_similarity_map = []
        query = request.query.strip()
        if not query:
            return []

        query = translate_query_to_english(query)
        query_embedding = self.embedding_service.embed(query)
        retrieved = self.retrieval_service.retrieve(
            query_embedding=query_embedding,
            top_k=self.retrieval_k,
        )
        if not retrieved:
            return []

        unique_records = {}
        unique_order = []
        for record in retrieved:
            is_number = record.get("is_number")
            if is_number and is_number not in unique_records:
                unique_records[is_number] = record
                unique_order.append(is_number)

        if not unique_order:
            return []

        stmt = select(Standard).where(Standard.is_number.in_(unique_order))
        requested_status = request.filters.status
        if requested_status:
            stmt = stmt.where(Standard.status == requested_status)
        else:
            stmt = stmt.where(Standard.status == "Active")
        if request.filters.department:
            stmt = stmt.where(Standard.department_name == request.filters.department)
        if request.filters.aspect:
            stmt = stmt.where(Standard.aspect == request.filters.aspect)

        standards = list(db.scalars(stmt).all())
        standards_by_number = {standard.is_number: standard for standard in standards}
        if not standards_by_number:
            return []

        self.last_similarity_map = self.build_similarity_map(
            query_embedding=query_embedding,
            retrieved_records=retrieved,
            standards_by_number=standards_by_number,
            top_k=settings.max_recommendations,
        )

        ranking_candidates = []
        for is_number in unique_order:
            standard = standards_by_number.get(is_number)
            if standard is None:
                continue
            record = unique_records[is_number]
            ranking_candidates.append(
                {
                    "is_number": is_number,
                    "is_title": standard.title,
                    "status": standard.status,
                    "similarity_score": float(record.get("similarity_score", 0.0)),
                    "_standard": standard,
                }
            )

        ranked = self.ranking_service.rank(
            query=query,
            candidates=ranking_candidates,
            top_k=settings.max_recommendations,
        )

        results = []
        query_terms = tokenize(query)
        for ranked_record in ranked:
            standard = ranked_record["_standard"]
            similarity = float(ranked_record["similarity_score"])
            final_score = float(ranked_record["final_score"])
            matched_requirements = [
                requirement
                for requirement in (standard.requirements or [])
                if query_terms & tokenize(requirement)
            ][:5]

            reason = (
                f"{standard.is_number} retrieved by semantic similarity to the "
                f"procurement specification (similarity {similarity:.3f})."
            )
            if matched_requirements:
                reason += (
                    f" The query also overlaps {len(matched_requirements)} "
                    "stored requirement(s)."
                )

            results.append(
                (standard, final_score, matched_requirements, reason)
            )

        return results
