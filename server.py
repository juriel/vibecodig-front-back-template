"""Single entry point: serves the backend at /api, the admin panel at /admin and the public CMS site at /."""
import sys
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "backend"))

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from main import api, startup  # backend/main.py
from app.routers.cms_public import router as cms_router  # public CMS site

WEB = ROOT / "frontend" / "web"


@asynccontextmanager
async def lifespan(_):
    startup()
    yield


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", api)
app.include_router(cms_router)  # /, /*.page, /css, /js, /media (before the fallback)

if (WEB / "dist").exists():
    app.mount("/dist", StaticFiles(directory=WEB / "dist"), name="dist")


@app.get("/admin", include_in_schema=False)
@app.get("/admin/{path:path}", include_in_schema=False)
def admin(path: str = ""):
    """Admin panel (SPA with login): any route under /admin returns index.html."""
    return FileResponse(WEB / "index.html")


@app.get("/{path:path}", include_in_schema=False)
def site(path: str):
    """Public site (no login): static files from web/ if they exist, 404 for anything else."""
    f = (WEB / path).resolve()
    if path and f.is_file() and WEB.resolve() in f.parents:
        return FileResponse(f)
    raise HTTPException(status_code=404)
