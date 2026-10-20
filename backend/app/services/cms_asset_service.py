"""Administration of the global CSS and JS assets (tables cms_css and cms_js; they work the same way).

Each asset is either EXTERNAL (`url`, nothing else) or OWN (`path` + `content`, served at /css/<path> or /js/<path>).
The public site includes the active ones, ordered by `order_show`.
"""
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.entities.cms_asset import CmsCss, CmsJs
from app.entities.cms_page import CmsPage
from app.errors import ApiError


@dataclass(frozen=True)
class AssetKind:
    entity: type
    ext: str              # required extension of own paths
    page_field: str       # page column holding the page-specific asset (served at /<kind>/<url><ext>)
    not_found: str        # error keys
    code_exists: str


CSS = AssetKind(CmsCss, ".css", "css", "error.css.not_found", "error.css.code_exists")
JS = AssetKind(CmsJs, ".js", "javascript", "error.js.not_found", "error.js.code_exists")


def _serialize(kind: AssetKind, asset, with_content: bool = False) -> dict:
    data = {
        "code": asset.code, "name": asset.name, "active": bool(asset.active), "order_show": asset.order_show or 0,
        "url": asset.url or "", "path": asset.path or "", "source": "external" if asset.url else "own",
        "content_length": len(asset.content or ""),
    }
    if kind is JS:
        data["type"] = asset.type
    if with_content:
        data["content"] = asset.content or ""
    return data


def _find(db: Session, kind: AssetKind, code: str):
    asset = db.get(kind.entity, code)
    if asset is None:
        raise ApiError(404, kind.not_found)
    return asset


def page_assets_taken(db: Session, kind: AssetKind, path: str) -> str | None:
    """If `path` would shadow the page-specific asset of a page, returns that page's URL (pages win only if no global matches)."""
    if not path.endswith(kind.ext):
        return None
    base = path[: -len(kind.ext)]
    pages = db.query(CmsPage).filter(getattr(CmsPage, kind.page_field) != "", getattr(CmsPage, kind.page_field).isnot(None))
    for page in pages:
        if page.url == base or (page.is_index and base in ("", "index")):
            return page.url
    return None


def _validate(db: Session, kind: AssetKind, dto, code: str | None = None):
    if dto.url and (dto.path or dto.content):
        raise ApiError(422, "error.asset.both_sources")
    if dto.url:
        return
    if not dto.path:
        raise ApiError(422, "error.asset.path_required")
    if not dto.path.endswith(kind.ext) or len(dto.path) == len(kind.ext):
        raise ApiError(422, "error.asset.path_extension", kind.ext)
    clash = db.query(kind.entity).filter(kind.entity.path == dto.path)
    if code is not None:
        clash = clash.filter(kind.entity.code != code)
    if clash.first():
        raise ApiError(409, "error.asset.path_exists")
    page_url = page_assets_taken(db, kind, dto.path)
    if page_url is not None:
        raise ApiError(409, "error.asset.path_conflicts_page", page_url)


def _apply(kind: AssetKind, asset, dto):
    asset.name = dto.name
    asset.active = int(dto.active)
    asset.order_show = dto.order_show
    # An external asset keeps no own file data (same as the original rows).
    asset.url, asset.path, asset.content = (dto.url, "", "") if dto.url else ("", dto.path, dto.content)
    if kind is JS:
        asset.type = dto.type


def list_assets(db: Session, kind: AssetKind) -> list[dict]:
    rows = db.query(kind.entity).order_by(kind.entity.order_show, kind.entity.name).all()
    return [_serialize(kind, a) for a in rows]


def get_asset(db: Session, kind: AssetKind, code: str) -> dict:
    return _serialize(kind, _find(db, kind, code), with_content=True)


def create_asset(db: Session, kind: AssetKind, dto) -> dict:
    if db.get(kind.entity, dto.code) is not None:
        raise ApiError(409, kind.code_exists)
    _validate(db, kind, dto)
    asset = kind.entity(code=dto.code)
    _apply(kind, asset, dto)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _serialize(kind, asset, with_content=True)


def update_asset(db: Session, kind: AssetKind, code: str, dto) -> dict:
    asset = _find(db, kind, code)
    _validate(db, kind, dto, code)
    _apply(kind, asset, dto)
    db.commit()
    db.refresh(asset)
    return _serialize(kind, asset, with_content=True)


def delete_asset(db: Session, kind: AssetKind, code: str) -> None:
    db.delete(_find(db, kind, code))
    db.commit()
