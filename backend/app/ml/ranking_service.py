class RankingService:
    """
    Ranks retrieved BIS standards.

    Version 1:
    Ranking is based directly on semantic similarity.

    Regulatory/status filtering is handled before ranking
    by MLRecommendationProvider.
    """

    def rank(
        self,
        query: str,
        candidates: list[dict],
        top_k: int = 5,
    ) -> list[dict]:

        if not candidates:
            return []

        if top_k <= 0:
            raise ValueError(
                "top_k must be greater than zero."
            )

        ranked_candidates = []

        for candidate in candidates:

            similarity = float(
                candidate.get(
                    "similarity_score",
                    0.0,
                )
            )

            ranked_candidate = dict(candidate)

            # For this first version, the semantic
            # similarity score is the final ranking score.
            ranked_candidate["final_score"] = similarity

            ranked_candidates.append(
                ranked_candidate
            )

        ranked_candidates.sort(
            key=lambda item: item["final_score"],
            reverse=True,
        )

        return ranked_candidates[:top_k]