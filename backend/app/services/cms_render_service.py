"""Public site rendering: page + layout + widgets + global CSS/JS (the equivalent of the original CMS page.jsp)."""
import html
import os
import re
from typing import Optional
from urllib.parse import quote

from sqlalchemy.orm import Session

from app.entities.cms_asset import CmsCss, CmsJs
from app.entities.cms_layout import CmsLayout
from app.entities.cms_page import CmsPage, PageXRegisteredUserGroup
from app.entities.cms_widget import CmsWidget
from app.entities.user import User
from app.services import cms_seo_service

# Language of the published site content (the <html lang> attribute); independent from the admin UI language.
SITE_LANG = os.environ.get("SITE_LANG", "en")

# %CONTENT% is inserted as-is (simple markers are not rescanned); widgets are expanded afterwards,
# so a %WIDGET:x% inside the page content or the layout is resolved too.
_VARS = re.compile(r"%(ID|TITLE|SUBTITLE|OWNER|CREATION_DATE|URL|UPDATE_DATE|CONTENT)%")
_WIDGET = re.compile(r"%WIDGET:([A-Za-z0-9_\-]+)%")


def find_page(db: Session, url: str) -> Optional[CmsPage]:
    """'' or 'index' → the index page (is_index=1); otherwise exact URL match."""
    if url in ("", "index"):
        return db.query(CmsPage).filter(CmsPage.is_index == 1).order_by(CmsPage.id).first()
    return db.query(CmsPage).filter(CmsPage.url == url).first()


def is_private(db: Session, page: CmsPage) -> bool:
    """Pages assigned to registered-user groups are private (the site login is not ported yet)."""
    return db.query(PageXRegisteredUserGroup).filter(PageXRegisteredUserGroup.cms_page == page.id).first() is not None


def _fmt_date(value) -> str:
    return value.strftime("%Y-%m-%d %H:%M:%S") if value else ""


def render_layout(db: Session, page: CmsPage) -> str:
    layout = db.get(CmsLayout, page.cms_layout)
    template = (layout.layout_content if layout else "") or "%CONTENT%"
    owner = db.get(User, page.owner)
    esc = html.escape
    values = {
        "ID": str(page.id),
        "TITLE": esc(page.title or ""),
        "SUBTITLE": esc(page.subtitle or ""),
        "OWNER": esc(owner.name if owner else page.owner or ""),
        "CREATION_DATE": _fmt_date(page.creation_date),
        "URL": esc(page.url or ""),
        "UPDATE_DATE": _fmt_date(page.last_update_date),
        "CONTENT": page.page_content or "",
    }
    out = _VARS.sub(lambda m: values[m.group(1)], template)

    names = set(_WIDGET.findall(out))
    widgets = {}
    if names:
        widgets = {w.name: w.value or "" for w in db.query(CmsWidget).filter(CmsWidget.name.in_(names)).all()}
    return _WIDGET.sub(lambda m: widgets.get(m.group(1), f"<!-- WIDGET NOT FOUND {m.group(1)} -->"), out)


def _css_links(db: Session, page: CmsPage) -> str:
    links = []
    for css in db.query(CmsCss).filter(CmsCss.active == 1).order_by(CmsCss.order_show).all():
        href = css.url if css.url else "/css/" + quote(css.path or "", safe="/")
        links.append(f'<link rel="stylesheet" type="text/css" href="{html.escape(href)}">')
    if page.css:
        links.append(f'<link rel="stylesheet" type="text/css" href="/css/{html.escape(quote(page.url, safe="/"))}.css">')
    return "\n".join(links)


def _js_scripts(db: Session, page: CmsPage, kind: str) -> str:
    scripts = []
    for js in db.query(CmsJs).filter(CmsJs.active == 1, CmsJs.type == kind).order_by(CmsJs.order_show).all():
        src = js.url if js.url else "/js/" + quote(js.path or "", safe="/")
        scripts.append(f'<script src="{html.escape(src)}"></script>')
    if kind == "footer" and page.javascript:
        scripts.append(f'<script src="/js/{html.escape(quote(page.url, safe="/"))}.js"></script>')
    return "\n".join(scripts)


def render_page(db: Session, page: CmsPage, base_url: str) -> str:
    """base_url: public origin (cms_seo_service.base_url), used for the canonical and Open Graph URLs."""
    keywords = f'<meta name="keywords" content="{html.escape(page.keywords, quote=True)}">' if page.keywords else ""
    return f"""<!DOCTYPE html>
<html lang="{html.escape(SITE_LANG)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>{html.escape(page.title or "")}</title>
{keywords}
{cms_seo_service.head_tags(db, page, base_url)}
{_css_links(db, page)}
{_js_scripts(db, page, "header")}
</head>
<body>
{render_layout(db, page)}
{_js_scripts(db, page, "footer")}
</body>
</html>
"""
