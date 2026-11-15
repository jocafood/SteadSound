"""Entrada conjunta para Vercel: API Python y UI Vite bajo el mismo origen."""
import sys
from pathlib import Path

from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
# Mantener compatible el backend independiente (Docker y comandos desde backend/).
sys.path.insert(0, str(ROOT / "backend"))
from backend.app import create_app  # noqa: E402

app = create_app()
# API registrada antes del mount; los archivos no sustituyen respuestas /api.
# check_dir=False permite importar durante la detección previa al build de Vite.
app.mount("/", StaticFiles(directory=ROOT / "dist", html=True, check_dir=False), name="ui")
