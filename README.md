# BIS Standard Recommender

A full-stack application for finding relevant Bureau of Indian Standards (BIS) from procurement specifications. The system combines structured BIS catalogue data with semantic retrieval and ranking, and presents the results through a technical dashboard.

## Features

- Procurement-specification based standard recommendations
- Semantic retrieval using BGE embeddings and FAISS
- Ranking with requirement matching and explainable result reasons
- Filters for status, department, and aspect
- Standard details with related and allied standards grouped by relationship
- Normative and allied-standard relationship visualization
- Semantic similarity map for recommendation results
- Search history and recommendation persistence
- PDF analysis workflow
- Multilingual interface and query translation for supported Indian languages
- Recommendation comparison for selected standards
- REST API backed by PostgreSQL

## Technology

- **Frontend:** React, Vite, TypeScript, React Router, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy, Alembic
- **Database:** PostgreSQL
- **Semantic search:** Sentence-transformer embeddings, FAISS, NumPy

## Repository Structure

```text
frontend/   React application, pages, components, services, types and localization
backend/    FastAPI application, database layer, recommendation and ML services
data/       BIS catalogue and supporting data files
scripts/    Project and data-management scripts
tests/      Automated tests
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Yarn or npm

### 1. Configure the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
```

Set at least `DATABASE_URL` in `backend/.env`. The recommendation provider is selected with `RECOMMENDATION_PROVIDER`; the default is `ml`.

### 2. Initialize the database

```bash
alembic upgrade head
python -m scripts.seed_db
```

### 3. Start the backend

```bash
uvicorn app.main:app --reload --port 8001
```

The API is available under `http://localhost:8001/api`.

### 4. Start the frontend

```bash
cd ../frontend
yarn install
yarn dev
```

The development server runs on `http://localhost:3000`. Set `VITE_BACKEND_URL=http://localhost:8001` in `frontend/.env` when required.

## Recommendation API

`POST /api/recommend`

```json
{
  "query": "43 grade cement for RCC construction",
  "document_name": null,
  "filters": {
    "status": null,
    "department": null,
    "aspect": null
  }
}
```

The response contains a request ID, ranked recommendations, matched requirements, explanations, related/allied standards, and semantic-map coordinates.

## Development

Frontend type checking and production build:

```bash
cd frontend
yarn typecheck
yarn build
```

Backend tests:

```bash
cd backend
pytest
```

## Configuration

Common backend settings are environment-driven:

- `DATABASE_URL`
- `CORS_ORIGINS`
- `RECOMMENDATION_PROVIDER`
- `MAX_RECOMMENDATIONS`
- `TRANSLATION_MODEL`
- `LOG_LEVEL`

See `.env.example` for the available configuration values.
