# BIS Standard Recommender

Recommends Bureau of Indian Standards (BIS) for a procurement specification.
This phase ships a fully working product on a **mock recommendation provider** —
no ML, embeddings or RAG yet — behind an interface that a real engine can slot
into later without changing the API contract or the frontend.

## Stack
- **Frontend:** React + Vite + TypeScript + React Router + Tailwind CSS
- **Backend:** Python + FastAPI + Pydantic + SQLAlchemy + Alembic
- **Database:** PostgreSQL

## Layout
```
frontend/   Vite app (pages, components, services, types)
backend/    FastAPI app (app/), Alembic migrations, seed script
data/       raw / processed corpora (empty placeholders)
scripts/    operational scripts
tests/      backend / frontend tests
```

## Quick start (local)

### 1. Database
```bash
createdb bis    # or use the DATABASE_URL of your choice
```

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env          # set DATABASE_URL
alembic upgrade head
python -m scripts.seed_db        # loads ~20 mock standards
uvicorn app.main:app --reload --port 8001
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env 2>/dev/null || true   # set VITE_BACKEND_URL=http://localhost:8001
yarn install
yarn dev
```

## The contract
`POST /api/recommend`
```json
{
  "query": "43 grade cement for RCC construction",
  "document_name": null,
  "filters": { "status": null, "department": null, "aspect": null }
}
```
Returns `request_id`, echoed `query`, and a ranked `recommendations[]` — each with
`score`, `matched_requirements`, `reason`, `status`, `related_standards` and an
`evidence` array reserved for future RAG citations.

## Swapping in a real engine
Implement `MLRecommendationProvider(RecommendationProvider)`
(`backend/app/services/recommendation_service.py`), register it, and set
`RECOMMENDATION_PROVIDER=ml`. The `ml/` and `rag/` packages hold the stubs.
