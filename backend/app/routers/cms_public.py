"""Public CMS site (outside /api): /<url>.page, /css/*, /js/*, /media/<folder>/<file>."""
import hashlib
import html
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse, HTMLResponse, Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.i18n import negotiate, t
from app.services import cms_public_service, cms_render_service

router = APIRouter(include_in_schema=False)

WEB = Path(__file__).resolve().parents[3] / "frontend" / "web"


def _lang(request: Request) -> str:
    return negotiate(request.headers.get("accept-language"))


def _page_html(lang: str, status: int, title: str, message: str) -> HTMLResponse:
    body = f"<!DOCTYPE html><html lang='{lang}'><meta charset='utf-8'><title>{html.escape(title)}</title><h1>{html.escape(title)}</h1><p>{html.escape(message)}</p></html>"
    return HTMLResponse(body, status_code=status)


def _error(request: Request, status: int, message_key: str) -> HTMLResponse:
    lang = _lang(request)
    return _page_html(lang, status, str(status), t(message_key, lang))


def _render(request: Request, db: Session, url: str) -> Response:
    page = cms_render_service.find_page(db, url)
    if page is None:
        return _error(request, 404, "site.error.page_not_found")
    if cms_render_service.is_private(db, page):
        return _error(request, 403, "site.error.page_private")
    return HTMLResponse(cms_render_service.render_page(db, page))


@router.get("/")
def index(request: Request, db: Session = Depends(get_db)):
    # With no index page in the CMS, a provisional "under construction" page is shown.
    if cms_render_service.find_page(db, "") is None:
        lang = _lang(request)
        return _page_html(lang, 200, t("site.under_construction.title", lang), t("site.under_construction.text", lang))
    return _render(request, db, "")


@router.get("/{url:path}.page")
def page(url: str, request: Request, db: Session = Depends(get_db)):
    return _render(request, db, url)


def _text_asset(request: Request, content: str, media_type: str) -> Response:
    """Serves CSS/JS with an ETag and `no-cache`: browsers revalidate on every request (cheap 304s), so an edit
    made in the admin panel shows up immediately instead of after a max-age window."""
    etag = '"' + hashlib.sha1(content.encode()).hexdigest() + '"'
    headers = {"ETag": etag, "Cache-Control": "public, no-cache"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    return Response(content, media_type=media_type, headers=headers)


@router.get("/css/{path:path}")
def css(path: str, request: Request, db: Session = Depends(get_db)):
    content = cms_public_service.css_content(db, path)
    if content is None:
        return _error(request, 404, "site.error.not_found")
    return _text_asset(request, content, "text/css; charset=utf-8")


@router.get("/js/{path:path}")
def js(path: str, request: Request, db: Session = Depends(get_db)):
    content = cms_public_service.js_content(db, path)
    if content is None:
        return _error(request, 404, "site.error.not_found")
    return _text_asset(request, content, "application/javascript; charset=utf-8")


@router.get("/media/{folder}/{filename:path}")
def media(folder: str, filename: str, request: Request, download: bool = False, db: Session = Depends(get_db)):
    found = cms_public_service.media_file(db, folder, filename)
    if found is None:
        return _error(request, 404, "site.error.file_not_found")
    path, content_type = found
    headers = {"Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff"}
    if content_type.split(";")[0] in ("text/html", "image/svg+xml", "application/xhtml+xml"):
        headers["Content-Security-Policy"] = "sandbox"   # an uploaded file cannot run scripts on this origin
    if download:
        headers["Content-Disposition"] = "attachment; filename*=UTF-8''" + quote(filename.rsplit("/", 1)[-1])
    return FileResponse(path, media_type=content_type, headers=headers)
