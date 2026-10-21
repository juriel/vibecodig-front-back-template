"""Single entry point: serves the backend at /api, the admin panel at /admin and the public CMS site at /."""
import sys
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "backend"))

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from main import api, startup  # backend/main.py
from app.db import get_db
from app.routers.cms_public import not_found, redirect_for, router as cms_router  # public CMS site

WEB = ROOT / "frontend" / "web"


@asynccontextmanager
async def lifespan(_):
    startup()
    yield


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(GZipMiddleware, minimum_size=1024)  # HTML, CSS, JS and JSON compressed (page speed counts for SEO)


@app.middleware("http")
async def revalidate_panel_files(request: Request, call_next):
    """The panel bundle (/dist) and its translations keep the same URL across builds: browsers must revalidate them
    (a cheap 304 when unchanged) instead of running an old cached version after an update."""
    response = await call_next(request)
    if request.url.path.startswith(("/dist/", "/assets/i18n/", "/admin")):
        response.headers["Cache-Control"] = "no-cache"
    return response

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
def site(path: str, request: Request, db=Depends(get_db)):
    """Public site (no login): static files from web/ if they exist; otherwise a CMS redirect or the 404 page."""
    redirect = redirect_for(request, db)
    if redirect is not None:
        return redirect
    f = (WEB / path).resolve()
    if path and f.is_file() and WEB.resolve() in f.parents:
        return FileResponse(f)
    return not_found(request, db)
