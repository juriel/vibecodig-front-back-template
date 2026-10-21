from datetime import datetime
from urllib.parse import quote

from sqlalchemy.orm import Session

from app.dtos.cms_page_dto import CmsPageCreateDTO, CmsPageUpdateDTO
from app.entities.cms_asset import CmsCss, CmsJs
from app.entities.cms_layout import CmsLayout
from app.entities.cms_page import CmsPage, PageXRegisteredUserGroup
from app.entities.cms_seo import CmsPageSeo
from app.entities.user import User
from app.errors import ApiError


def _summary(page: CmsPage, layout_name: str | None, owner_name: str | None) -> dict:
    return {
        "id": page.id, "url": page.url, "title": page.title, "cms_layout": page.cms_layout,
        "layout_name": layout_name, "is_index": bool(page.is_index), "owner": page.owner,
        "owner_name": owner_name, "last_update_date": page.last_update_date.isoformat() if page.last_update_date else None,
    }


SEO_FIELDS = ("description", "og_title", "og_description", "og_image", "canonical")


def _seo(db: Session, page_id: int) -> dict:
    seo = db.get(CmsPageSeo, page_id)
    values = {f: (getattr(seo, f) if seo else None) for f in SEO_FIELDS}
    values["noindex"] = bool(seo.noindex) if seo else False
    return values


def _save_seo(db: Session, page_id: int, dto: CmsPageCreateDTO):
    seo = db.get(CmsPageSeo, page_id) or CmsPageSeo(cms_page=page_id)
    for f in SEO_FIELDS:
        setattr(seo, f, (getattr(dto, f) or "").strip() or None)
    seo.noindex = int(dto.noindex)
    db.add(seo)


def _detail(db: Session, page: CmsPage) -> dict:
    return _seo(db, page.id) | {
        "id": page.id, "cms_layout": page.cms_layout, "url": page.url, "title": page.title, "subtitle": page.subtitle,
        "keywords": page.keywords, "page_content": page.page_content or "", "css": page.css or "", "javascript": page.javascript or "",
        "is_index": bool(page.is_index), "owner": page.owner,
        "creation_date": page.creation_date.isoformat() if page.creation_date else None,
        "last_update_date": page.last_update_date.isoformat() if page.last_update_date else None,
    }


def _find(db: Session, page_id: int) -> CmsPage:
    page = db.get(CmsPage, page_id)
    if page is None:
        raise ApiError(404, "error.page.not_found")
    return page


def _check(db: Session, dto: CmsPageCreateDTO, page_id: int | None = None):
    if db.get(CmsLayout, dto.cms_layout) is None:
        raise ApiError(400, "error.page.layout_not_found")
    taken = db.query(CmsPage).filter(CmsPage.url == dto.url)
    if page_id is not None:
        taken = taken.filter(CmsPage.id != page_id)
    if taken.first():
        raise ApiError(409, "error.page.url_exists")
    # A global asset served at the same path (/css/<url>.css, /js/<url>.js) would shadow this page's own CSS/JS.
    names = {dto.url} | ({"index"} if dto.is_index else set())
    for content, entity, ext in ((dto.css, CmsCss, ".css"), (dto.javascript, CmsJs, ".js")):
        if content and db.query(entity).filter(entity.path.in_([n + ext for n in names])).first():
            raise ApiError(409, "error.page.url_asset_conflict")


def _single_index(db: Session, page: CmsPage):
    """Only one page can be the index page (/)."""
    if page.is_index:
        db.query(CmsPage).filter(CmsPage.id != page.id).update({CmsPage.is_index: 0})


def editor_assets(db: Session) -> dict:
    """Stylesheets the visual editor loads in its canvas so the page looks as published (active global CSS, in order)."""
    styles = [c.url if c.url else "/css/" + quote(c.path or "", safe="/")
              for c in db.query(CmsCss).filter(CmsCss.active == 1).order_by(CmsCss.order_show)]
    return {"styles": styles}


def list_layouts(db: Session) -> list[dict]:
    """Layouts available for the form selector."""
    return [{"id": l.id, "layout_name": l.layout_name} for l in db.query(CmsLayout).order_by(CmsLayout.layout_name)]


def list_pages(db: Session) -> list[dict]:
    layouts = {l.id: l.layout_name for l in db.query(CmsLayout)}
    owners = {u.login: u.name for u in db.query(User.login, User.name)}
    return [_summary(p, layouts.get(p.cms_layout), owners.get(p.owner)) for p in db.query(CmsPage).order_by(CmsPage.url)]


def get_page(db: Session, page_id: int) -> dict:
    return _detail(db, _find(db, page_id))


def create_page(db: Session, actor: User, dto: CmsPageCreateDTO) -> dict:
    _check(db, dto)
    now = datetime.now()
    page = CmsPage(
        cms_layout=dto.cms_layout, url=dto.url, title=dto.title, subtitle=dto.subtitle or None, keywords=dto.keywords or None,
        page_content=dto.page_content, css=dto.css, javascript=dto.javascript, is_index=int(dto.is_index),
        creation_date=now, last_update_date=now, owner=actor.login,
    )
    db.add(page)
    db.flush()
    _single_index(db, page)
    _save_seo(db, page.id, dto)
    db.commit()
    db.refresh(page)
    return _detail(db, page)


def update_page(db: Session, page_id: int, dto: CmsPageUpdateDTO) -> dict:
    page = _find(db, page_id)
    _check(db, dto, page_id)
    page.cms_layout, page.url, page.title = dto.cms_layout, dto.url, dto.title
    page.subtitle, page.keywords = dto.subtitle or None, dto.keywords or None
    page.page_content, page.css, page.javascript = dto.page_content, dto.css, dto.javascript
    page.is_index = int(dto.is_index)
    page.last_update_date = datetime.now()       # owner and creation date do not change
    _single_index(db, page)
    _save_seo(db, page.id, dto)
    db.commit()
    db.refresh(page)
    return _detail(db, page)


def delete_page(db: Session, page_id: int) -> None:
    page = _find(db, page_id)
    db.query(PageXRegisteredUserGroup).filter(PageXRegisteredUserGroup.cms_page == page_id).delete()
    db.query(CmsPageSeo).filter(CmsPageSeo.cms_page == page_id).delete()
    db.delete(page)
    db.commit()
