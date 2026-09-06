# BIS Standard Recommender — Product Requirements

## Original Problem Statement
Build a full-stack "BIS Standard Recommender". Stack: React + Vite + TypeScript + React Router + Tailwind (frontend); FastAPI + Pydantic + SQLAlchemy + Alembic (backend); PostgreSQL. No MongoDB/microservices/agentic AI/LangChain. No real ML/embeddings/RAG in this phase — use a mock recommendation provider only. Ship the exact repo structure and the exact POST /api/recommend contract. Must run locally after GitHub pull with no runtime dependency on the build tool.

## User Choices
- Runs in preview AND locally (Postgres live in preview; swappable via .env locally).
- Design: modern dark technical data-dashboard.
- Focus domains: cement, textiles, electronics, food safety.
- Future-changeable, non-generic code, minimal comments.

## Architecture
- Backend `backend/app/`: api/routes (health, standards, recommendations, search), core (config, logging), db (database, models, repositories, seed), schemas, services (standard/recommendation/search + RecommendationProvider interface & MockRecommendationProvider), ml/ & rag/ (inert stubs). `server.py` imports `app.main:app` for supervisor.
- DB models: standards, standard_relationships, documents, chunks (unused), search_history, recommendations. Alembic migration + idempotent seed (~21 standards, 29 relationships).
- Frontend `frontend/src/`: pages (Dashboard, Recommendation, StandardDetails, SearchHistory, NotFound), components (common/layout/dashboard/recommendation/standards), services (api, standardsApi, recommendationApi), types (standard, recommendation, api), hooks, utils. Vite on port 3000, API via VITE_BACKEND_URL.

## Implemented (2026-06)
- POST /api/recommend to exact contract; MockRecommendationProvider (keyword-overlap scoring) swappable via RECOMMENDATION_PROVIDER env.
- Standards read + create, stats overview, filter metadata, search history endpoints; health check with DB probe.
- Full dark dashboard UI: stats, domain coverage chart, quick spec, spec form with samples, PDF upload placeholder, status/department/aspect filters, ranked results with score/chips/reason/status, standard details with related standards, search history table with re-run, 404.
- Postgres + Alembic + seed live in preview. Tested: 12/12 backend + all frontend flows (100%).

## Backlog / Future (P1/P2)
- P1: Real ML/RAG phase — MLRecommendationProvider, embeddings, pgvector, document/chunk ingestion + PDF parsing, evidence citations.
- P2: Auth, standard editing UI, export of recommendations, pagination on standards list.

## Next Tasks
- None blocking. Ready for GitHub pull / local run.
