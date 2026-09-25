# MANAK — BIS Standard Recommender

A full-stack application for discovering and comparing relevant **Bureau of Indian Standards (BIS)** from procurement requirements, technical specifications, and documents.

MANAK combines a structured BIS catalogue with semantic retrieval, requirement-aware ranking, relationship analysis, and a React dashboard so users can move from a procurement requirement to relevant standards and supporting evidence in one workflow.

> **Project status:** Development project. Verify recommendations and compliance conclusions against the applicable BIS publication before making procurement or regulatory decisions.

## What it does

- **Requirement-based recommendations** — submit a natural-language procurement or technical requirement and receive ranked BIS standards.
- **Semantic retrieval** — uses sentence-transformer embeddings with FAISS for similarity search.
- **Requirement matching and explanations** — surfaces matched requirements and reasons behind recommendations.
- **Standards discovery** — browse and search the BIS catalogue, open standard details, and inspect relationships.
- **Relationship analysis** — groups related, normative, and allied standards and visualizes those relationships.
- **Compliance workflow** — provides a dedicated compliance-check experience for evaluating requirements against standards.
- **PDF analysis** — supports a document-driven workflow for extracting and analyzing requirements from PDFs.
- **Multilingual support** — translates supported Indian-language queries through the configured LLM provider.
- **Recommendation comparison** — compare selected standards side by side.
- **History and persistence** — keeps recommendation/search activity available through the application and API.
- **Dashboard analytics** — presents recommendation and catalogue information through interactive charts.

## Application

The frontend currently exposes these primary routes:

| Route | Purpose |
| --- | --- |
| `/` | Dashboard |
| `/recommendation` | Requirement-based BIS recommendations |
| `/pdf-analysis` | PDF/document analysis |
| `/search-standards` | Search the BIS catalogue |
| `/browse` | Browse standards |
| `/standards/:id` | Standard details and relationships |
| `/compliance` | Compliance-check workflow |
| `/compare-standards` | Compare selected standards |
| `/history` | Search/recommendation history |

## Architecture

```text
                 ┌──────────────────────────┐
                 │      React + Vite UI     │
                 │ TypeScript / Tailwind /   │
                 │ Recharts / React Router   │
                 └────────────┬─────────────┘
                              │ HTTP
                              ▼
                 ┌──────────────────────────┐
                 │       FastAPI API        │
                 │ Recommendations / Search │
                 │ Standards / PDF / Chat   │
                 └───────┬─────────┬────────┘
                         │         │
                ┌────────▼───┐ ┌──▼──────────────────┐
                │ PostgreSQL │ │ Semantic Retrieval   │
                │ + Alembic  │ │ BGE embeddings +    │
                │            │ │ FAISS + NumPy       │
                └────────────┘ └─────────────────────┘
```

The backend initializes the ML recommendation provider at startup when `RECOMMENDATION_PROVIDER=ml`.

## Tech stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Recharts
- Axios
- Lucide React
- Sonner

### Backend

- Python 3.11+
- FastAPI
- Pydantic / pydantic-settings
- SQLAlchemy
- Alembic
- PostgreSQL via psycopg2
- Sentence Transformers
- FAISS
- NumPy
- PyPDF
- LiteLLM-compatible LLM integrations

## Repository layout

```text
.
├── backend/       FastAPI service, API routes, database and ML services
├── frontend/      React application, pages, components and client services
├── data/          BIS catalogue/supporting data when present
├── scripts/       Data/project maintenance scripts
├── tests/         Automated tests
├── test_reports/  Generated test/report artifacts
├── memory/        Project memory/support files
├── .env.example   Example environment configuration
└── README.md      Project documentation
```

## Requirements

Install these before starting:

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL**
- **npm** (included with Node.js)

## Quick start

### 1. Clone and enter the repository

```bash
git clone <repository-url>
cd MANAK-BIS-Project
```

### 2. Configure environment variables

The repository includes a root `.env.example`.

Create the backend environment file:

```bash
cp .env.example backend/.env
```

At minimum, configure a valid PostgreSQL connection:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
```

The main runtime settings are:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `CORS_ORIGINS` | Allowed frontend/API origins | `*` |
| `RECOMMENDATION_PROVIDER` | Recommendation backend | `ml` |
| `MAX_RECOMMENDATIONS` | Maximum recommendations returned | `10` |
| `LOG_LEVEL` | Backend logging level | `INFO` |
| `TRANSLATION_MODEL` | LiteLLM-compatible translation model | `gemini/gemini-1.5-flash` |
| `LLM_MODEL` | Optional LLM model used by chat/LLM features | empty |
| `GEMINI_API_KEY` | Gemini credential when using Gemini | — |
| `GROQ_API_KEY` | Groq credential when using Groq | — |
| `VITE_BACKEND_URL` | Frontend backend URL | `http://localhost:8001` |

**Security:** never commit real API keys, database passwords, or other secrets. Use `backend/.env` locally and keep credentials out of source control.

### 3. Set up the backend

```bash
cd backend

python -m venv .venv
```

Activate the virtual environment.

**macOS/Linux:**

```bash
source .venv/bin/activate
```

**Windows PowerShell:**

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 4. Initialize the database

From `backend/`:

```bash
alembic upgrade head
python -m scripts.seed_db
```

### 5. Start the API

From `backend/`:

```bash
uvicorn app.main:app --reload --port 8001
```

The backend exposes:

- API base: `http://localhost:8001/api`
- Swagger UI: `http://localhost:8001/docs`

### 6. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs on:

```text
http://localhost:3000
```

When the frontend needs a non-default backend URL, set:

```env
VITE_BACKEND_URL=http://localhost:8001
```

## Recommendation API

The core recommendation endpoint is:

```http
POST /api/recommend
```

Example request:

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

The recommendation response is designed to include a request identifier, ranked standards, requirement matches, explanations, related/allied standards, and semantic-map coordinates.

The complete API surface is grouped into routes for:

- health
- dashboard
- recommendations
- standards
- search
- PDF analysis
- summaries
- chat

Use the Swagger UI at `/docs` to inspect the exact schemas and available endpoints for the current revision.

## Development commands

### Frontend

Type-check:

```bash
cd frontend
npm run typecheck
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Backend

Run tests:

```bash
cd backend
pytest
```

## Recommendation pipeline

At a high level, recommendation requests follow this pattern:

```text
Procurement requirement / document
            │
            ▼
     Query preparation
            │
            ▼
     Semantic retrieval
   BGE embedding + FAISS
            │
            ▼
 Requirement-aware ranking
            │
            ▼
 Explanations + relationships
            │
            ▼
 Dashboard recommendation view
```

The configured embedding model is `BAAI/bge-small-en-v1.5`.

## Data and database

The application uses PostgreSQL for persistent application data and SQLAlchemy/Alembic for the database layer and migrations.

Database initialization should be performed through Alembic before seeding:

```bash
alembic upgrade head
python -m scripts.seed_db
```

Keep environment-specific database credentials outside the repository.

## Notes for deployment

This repository is currently configured for local/development workflows:

- Vite serves the frontend on port `3000`.
- Uvicorn serves the API on port `8001`.
- CORS is configurable through `CORS_ORIGINS`.
- The ML recommendation provider may initialize model resources during API startup.
- Production deployments should use production-grade process management, secrets handling, database provisioning, and a restricted CORS policy.

## License

No license file is currently documented in this repository. Add a `LICENSE` file before distributing the project under a specific open-source license.

## Contributing

For changes to the application:

1. Update or add tests for backend behavior where applicable.
2. Run backend tests and frontend type-check/build locally.
3. Keep secrets and environment-specific configuration out of commits.
4. Update this README when setup, routes, configuration, or major workflows change.
