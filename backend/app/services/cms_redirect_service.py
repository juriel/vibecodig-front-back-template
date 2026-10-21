from sqlalchemy.orm import Session

from app.dtos.cms_redirect_dto import CmsRedirectCreateDTO, CmsRedirectUpdateDTO
from app.entities.cms_seo import CmsRedirect
from app.errors import ApiError

# Paths the site serves itself: a redirect there would never be reached (or would hijack the panel/API).
_RESERVED = ("/admin", "/api/", "/css/", "/js/", "/media/", "/dist/")


def _serialize(r: CmsRedirect) -> dict:
    return {"id": r.id, "source": r.source, "target": r.target, "status_code": r.status_code, "active": bool(r.active)}


def _find(db: Session, redirect_id: int) -> CmsRedirect:
    redirect = db.get(CmsRedirect, redirect_id)
    if redirect is None:
        raise ApiError(404, "error.redirect.not_found")
    return redirect


def _check(db: Session, dto: CmsRedirectCreateDTO, redirect_id: int | None = None):
    if dto.source.startswith(_RESERVED) or dto.source.endswith(".page") or dto.source in ("/sitemap.xml", "/robots.txt"):
        raise ApiError(400, "error.redirect.reserved_source")
    if dto.source == dto.target:
        raise ApiError(400, "error.redirect.loop")
    q = db.query(CmsRedirect).filter(CmsRedirect.source == dto.source)
    if redirect_id is not None:
        q = q.filter(CmsRedirect.id != redirect_id)
    if q.first():
        raise ApiError(409, "error.redirect.source_exists")


def list_redirects(db: Session) -> list[dict]:
    return [_serialize(r) for r in db.query(CmsRedirect).order_by(CmsRedirect.source)]


def get_redirect(db: Session, redirect_id: int) -> dict:
    return _serialize(_find(db, redirect_id))


def create_redirect(db: Session, dto: CmsRedirectCreateDTO) -> dict:
    _check(db, dto)
    redirect = CmsRedirect(source=dto.source, target=dto.target, status_code=dto.status_code, active=int(dto.active))
    db.add(redirect)
    db.commit()
    db.refresh(redirect)
    return _serialize(redirect)


def update_redirect(db: Session, redirect_id: int, dto: CmsRedirectUpdateDTO) -> dict:
    redirect = _find(db, redirect_id)
    _check(db, dto, redirect_id)
    redirect.source, redirect.target = dto.source, dto.target
    redirect.status_code, redirect.active = dto.status_code, int(dto.active)
    db.commit()
    db.refresh(redirect)
    return _serialize(redirect)


def delete_redirect(db: Session, redirect_id: int) -> None:
    db.delete(_find(db, redirect_id))
    db.commit()
