# BIS Standard Recommender — Backend

FastAPI service for BIS standard search and recommendation. The backend uses PostgreSQL for authoritative catalogue data and supports both keyword-based and semantic recommendation providers.

## Structure

```text
app/
  api/routes/       HTTP endpoints
  core/             configuration and logging
  db/               database models, repositories and seed data
  schemas/          Pydantic request and response models
  services/         recommendation, standards, search and allied-standard services
  ml/               embedding, retrieval and ranking services
  main.py           FastAPI application
server.py           application entry point
```

## Recommendation Pipeline

The ML provider processes a procurement specification through:

1. Query translation for supported non-English input
2. BGE embedding generation
3. FAISS semantic retrieval
4. Database validation and filtering
5. Requirement-aware ranking
6. Recommendation and semantic-map generation

The recommendation provider is selected with `RECOMMENDATION_PROVIDER`. The default configuration uses the ML provider; the keyword provider remains available for lightweight deployments and testing.

## Run Locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
alembic upgrade head
python -m scripts.seed_db
uvicorn app.main:app --reload --port 8001
```

Set `DATABASE_URL` and other required values in `.env` before starting the service.

## API

Primary recommendation endpoint:

```text
POST /api/recommend
```

Example request:

```json
{
  "query": "43 grade cement for RCC",
  "document_name": null,
  "filters": {
    "status": null,
    "department": null,
    "aspect": null
  }
}
```

Additional routes cover health checks, standards, search and search history.
