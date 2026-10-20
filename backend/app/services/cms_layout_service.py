from sqlalchemy.orm import Session

from app.dtos.cms_layout_dto import CmsLayoutCreateDTO, CmsLayoutUpdateDTO
from app.entities.cms_layout import CmsLayout, CmsTypeLayout
from app.entities.cms_page import CmsPage
from app.errors import ApiError


def _serialize(layout: CmsLayout, types: dict[str, str], used_by: int = 0) -> dict:
    return {
        "id": layout.id, "layout_name": layout.layout_name, "cms_type_layout": layout.cms_type_layout,
        "type_name": types.get(layout.cms_type_layout), "layout_content": layout.layout_content or "",
        "default_layout": bool(layout.default_layout), "used_by": used_by,
    }


def _types(db: Session) -> dict[str, str]:
    return {t.code: t.type_name for t in db.query(CmsTypeLayout)}


def _find(db: Session, layout_id: int) -> CmsLayout:
    layout = db.get(CmsLayout, layout_id)
    if layout is None:
        raise ApiError(404, "error.layout.not_found")
    return layout


def _check_type(db: Session, code: str):
    if db.get(CmsTypeLayout, code) is None:
        raise ApiError(400, "error.layout.type_not_found")


def _normalize_defaults(db: Session, layout: CmsLayout):
    """One default layout per type; if the type has none, this one becomes it (same as the original CMS)."""
    same_type = db.query(CmsLayout).filter(CmsLayout.cms_type_layout == layout.cms_type_layout)
    if layout.default_layout:
        same_type.filter(CmsLayout.id != layout.id).update({CmsLayout.default_layout: False})
    elif not same_type.filter(CmsLayout.default_layout.is_(True), CmsLayout.id != layout.id).first():
        layout.default_layout = True


def list_types(db: Session) -> list[dict]:
    return [{"code": code, "type_name": name} for code, name in _types(db).items()]


def list_layouts(db: Session) -> list[dict]:
    types = _types(db)
    counts = {}
    for (layout_id,) in db.query(CmsPage.cms_layout):
        counts[layout_id] = counts.get(layout_id, 0) + 1
    return [_serialize(l, types, counts.get(l.id, 0)) for l in db.query(CmsLayout).order_by(CmsLayout.layout_name)]


def get_layout(db: Session, layout_id: int) -> dict:
    return _serialize(_find(db, layout_id), _types(db))


def create_layout(db: Session, dto: CmsLayoutCreateDTO) -> dict:
    _check_type(db, dto.cms_type_layout)
    layout = CmsLayout(layout_name=dto.layout_name, cms_type_layout=dto.cms_type_layout,
                       layout_content=dto.layout_content, default_layout=dto.default_layout)
    db.add(layout)
    db.flush()
    _normalize_defaults(db, layout)
    db.commit()
    db.refresh(layout)
    return _serialize(layout, _types(db))


def update_layout(db: Session, layout_id: int, dto: CmsLayoutUpdateDTO) -> dict:
    layout = _find(db, layout_id)
    _check_type(db, dto.cms_type_layout)
    old_type = layout.cms_type_layout
    layout.layout_name, layout.cms_type_layout = dto.layout_name, dto.cms_type_layout
    layout.layout_content, layout.default_layout = dto.layout_content, dto.default_layout
    db.flush()
    _normalize_defaults(db, layout)
    if old_type != layout.cms_type_layout:       # if the type changed, the old type must not be left without a default
        _promote_default(db, old_type)
    db.commit()
    db.refresh(layout)
    return _serialize(layout, _types(db))


def _promote_default(db: Session, type_code: str):
    remaining = db.query(CmsLayout).filter(CmsLayout.cms_type_layout == type_code).order_by(CmsLayout.id).all()
    if remaining and not any(l.default_layout for l in remaining):
        remaining[0].default_layout = True


def delete_layout(db: Session, layout_id: int) -> None:
    layout = _find(db, layout_id)
    used = db.query(CmsPage).filter(CmsPage.cms_layout == layout_id).count()
    if used:
        raise ApiError(409, "error.layout.in_use", used)
    type_code = layout.cms_type_layout
    db.delete(layout)
    db.flush()
    _promote_default(db, type_code)
    db.commit()
