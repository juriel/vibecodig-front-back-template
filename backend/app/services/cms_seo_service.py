"""Public SEO: <head> meta tags, sitemap.xml, robots.txt, redirects and the CMS 404 page."""
import html
from typing import Optional
from urllib.parse import quote
from xml.sax.saxutils import escape as xml_escape

from sqlalchemy.orm import Session

from app.entities.cms_page import CmsPage, PageXRegisteredUserGroup
from app.entities.cms_seo import CmsPageSeo, CmsRedirect, GlobalConfiguration
from app.entities.cms_widget import CmsWidget

NOT_FOUND_URL = "404"      # a CMS page with this URL is shown (with status 404) for unknown routes
HEAD_WIDGET = "head"       # a widget with this name is inserted in every page's <head> (favicon, verification tags...)


def settings(db: Session) -> dict[str, str]:
    """seo.* values from global_configuration (seo.site_url, seo.site_name, seo.locale); empty ones are left out."""
    rows = db.query(GlobalConfiguration).filter(GlobalConfiguration.code.like("seo.%")).all()
    return {r.code: r.value.strip() for r in rows if r.value and r.value.strip()}


def base_url(db: Session, request_base: str) -> str:
    """Public origin without a trailing slash: seo.site_url if configured, otherwise the one the request came in on."""
    return (settings(db).get("seo.site_url") or request_base).rstrip("/")


def page_url(base: str, page: CmsPage) -> str:
    return base + "/" if page.is_index else f"{base}/{quote(page.url, safe='/')}.page"


def _absolute(base: str, value: str) -> str:
    return base + value if value.startswith("/") else value


def head_tags(db: Session, page: CmsPage, base: str) -> str:
    """description, canonical, robots, Open Graph and Twitter Card tags, plus the `head` widget."""
    seo = db.get(CmsPageSeo, page.id)
    site = settings(db)
    esc = lambda v: html.escape(v, quote=True)
    title = page.title or ""
    description = (seo.description if seo else None) or ""
    canonical = (seo.canonical if seo else None) or page_url(base, page)
    og_title = (seo.og_title if seo else None) or title
    og_description = (seo.og_description if seo else None) or description
    og_image = _absolute(base, seo.og_image) if seo and seo.og_image else ""

    tags = []
    if description:
        tags.append(f'<meta name="description" content="{esc(description)}">')
    if (seo and seo.noindex) or page.url == NOT_FOUND_URL:
        tags.append('<meta name="robots" content="noindex, follow">')
    else:
        tags.append(f'<link rel="canonical" href="{esc(canonical)}">')
    tags += [
        '<meta property="og:type" content="website">',
        f'<meta property="og:title" content="{esc(og_title)}">',
        f'<meta property="og:url" content="{esc(canonical)}">',
    ]
    if og_description:
        tags.append(f'<meta property="og:description" content="{esc(og_description)}">')
    if og_image:
        tags.append(f'<meta property="og:image" content="{esc(og_image)}">')
    if site.get("seo.site_name"):
        tags.append(f'<meta property="og:site_name" content="{esc(site["seo.site_name"])}">')
    if site.get("seo.locale"):
        tags.append(f'<meta property="og:locale" content="{esc(site["seo.locale"])}">')
    tags.append(f'<meta name="twitter:card" content="{"summary_large_image" if og_image else "summary"}">')
    tags.append(f'<meta name="twitter:title" content="{esc(og_title)}">')
    if og_description:
        tags.append(f'<meta name="twitter:description" content="{esc(og_description)}">')
    if og_image:
        tags.append(f'<meta name="twitter:image" content="{esc(og_image)}">')

    widget = db.query(CmsWidget).filter(CmsWidget.name == HEAD_WIDGET).first()
    if widget and widget.value:
        tags.append(widget.value)
    return "\n".join(tags)


def sitemap(db: Session, base: str) -> str:
    """Public, indexable pages: not private, not noindex, not the 404 page, and without a canonical pointing elsewhere."""
    private = {r.cms_page for r in db.query(PageXRegisteredUserGroup.cms_page)}
    seo = {s.cms_page: s for s in db.query(CmsPageSeo)}
    entries = []
    for page in db.query(CmsPage).order_by(CmsPage.is_index.desc(), CmsPage.url):
        s = seo.get(page.id)
        own = page_url(base, page)
        if page.id in private or page.url == NOT_FOUND_URL or (s and s.noindex) or (s and s.canonical and s.canonical != own):
            continue
        lastmod = f"<lastmod>{page.last_update_date.date().isoformat()}</lastmod>" if page.last_update_date else ""
        entries.append(f"  <url><loc>{xml_escape(own)}</loc>{lastmod}</url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(entries) + "\n</urlset>\n")


def robots(base: str) -> str:
    """The panel and the API stay out of search engines; CSS, JS and media remain crawlable (needed to render the pages)."""
    return f"User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: {base}/sitemap.xml\n"


def find_redirect(db: Session, path: str) -> Optional[CmsRedirect]:
    """Active redirect for a request path ('/old.html'); matched with and without a trailing slash."""
    candidates = {path, path.rstrip("/") or "/"}
    return db.query(CmsRedirect).filter(CmsRedirect.active == 1, CmsRedirect.source.in_(candidates)).first()


def not_found_page(db: Session) -> Optional[CmsPage]:
    return db.query(CmsPage).filter(CmsPage.url == NOT_FOUND_URL).first()
