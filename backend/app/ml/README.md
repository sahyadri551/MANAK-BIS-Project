# ML layer (future)

This package is intentionally inert in the current phase.

Planned components:
- `embedding_service.py` — turn standards/spec text into vectors.
- `retrieval_service.py` — pgvector / hybrid candidate retrieval.
- `ranking_service.py` — rerank candidates before returning.

The API contract stays fixed. When these land, add an
`MLRecommendationProvider(RecommendationProvider)` in the services layer and
switch `RECOMMENDATION_PROVIDER=ml` in the environment — no frontend changes.
