"""Azure App Service entrypoint.

Azure looks for `app.py` at the repo root and expects a FastAPI/Flask app named `app`.
Our actual FastAPI app lives in `backend/server.py`. This module re-exports it so
Azure's default gunicorn startup command (`gunicorn app:app`) just works.
"""
import sys
from pathlib import Path

# Make `backend/` importable as a top-level package
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from server import app  # noqa: E402,F401  (Azure imports `app` from this module)
