"""Entrypoint used by the platform supervisor (`uvicorn server:app`).

Locally you can run either `uvicorn server:app` or `uvicorn app.main:app`.
"""

from app.main import app  # noqa: F401
