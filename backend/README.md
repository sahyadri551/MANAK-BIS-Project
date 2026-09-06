# BIS Standard Recommender — Backend

FastAPI + SQLAlchemy + Alembic over PostgreSQL. Recommendations are served by a
`MockRecommendationProvider` behind a `RecommendationProvider` interface, so the
scoring engine can be swapped for a real ML/RAG one without touching the API
contract or the frontend.

## Layout
```
app/
  api/routes/    health, standards, recommendations, search
  core/          config (env-driven), logging
  db/            database, models, repositories, seed_data
  schemas/       Pydantic request/response models
  services/      standard / recommendation / search services + providers
  ml/  rag/      inert placeholders for the future ML & RAG phase
  main.py        FastAPI app
server.py        supervisor entrypoint (imports app.main:app)
```

## Run locally
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env         # then edit DATABASE_URL
alembic upgrade head
python -m scripts.seed_db
uvicorn app.main:app --reload --port 8001
```

## Key endpoint
`POST /api/recommend`
```json
{ "query": "43 grade cement for RCC", "document_name": null,
  "filters": { "status": null, "department": null, "aspect": null } }
```

Config is entirely environment-driven (`.env`). Set `RECOMMENDATION_PROVIDER=ml`
once an `MLRecommendationProvider` exists.
