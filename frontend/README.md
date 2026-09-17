# BIS Standard Recommender — Frontend

React frontend for the BIS Standard Recommender. The application provides specification entry, recommendation results, standard details, relationship views, search history, comparison, semantic visualizations and multilingual UI support.

## Stack

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Recharts
- Axios
- Lucide React
- Sonner

## Development

Install dependencies and start the Vite development server:

```bash
yarn install
yarn dev
```

The application runs on `http://localhost:3000` by default.

Configure the backend URL in `.env`:

```text
VITE_BACKEND_URL=http://localhost:8001
```

## Validation

Run the TypeScript type checker:

```bash
yarn typecheck
```

Create a production build:

```bash
yarn build
```

Preview the production build locally:

```bash
yarn preview
```

## Application Areas

- Dashboard
- Standard recommendation
- Standard details and allied-standard relationships
- Search standards
- Search history
- Recommendation comparison
- PDF analysis
- Multilingual interface
