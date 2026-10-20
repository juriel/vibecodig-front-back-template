"""Entry point único: sirve el backend en /api y el frontend compilado en /."""
import sys
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "backend"))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from main import api, startup  # backend/main.py

WEB = ROOT / "frontend" / "web"


@asynccontextmanager
async def lifespan(_):
    startup()
    yield


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", api)

if (WEB / "dist").exists():
    app.mount("/dist", StaticFiles(directory=WEB / "dist"), name="dist")


@app.get("/{path:path}", include_in_schema=False)
def spa(path: str):
    """Archivos estáticos de web/ si existen; si no, index.html (fallback SPA)."""
    f = (WEB / path).resolve()
    if path and f.is_file() and WEB.resolve() in f.parents:
        return FileResponse(f)
    return FileResponse(WEB / "index.html")
