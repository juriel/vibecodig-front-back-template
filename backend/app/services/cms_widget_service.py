from sqlalchemy.orm import Session

from app.dtos.cms_widget_dto import CmsWidgetCreateDTO, CmsWidgetUpdateDTO
from app.entities.cms_layout import CmsLayout
from app.entities.cms_page import CmsPage
from app.entities.cms_widget import CmsWidget
from app.errors import ApiError


def _marker(name: str) -> str:
    return f"%WIDGET:{name}%"


def _references(db: Session, name: str) -> tuple[int, int]:
    """(layouts, pages) that insert this widget with %WIDGET:name%."""
    # contains(autoescape) escapes % and _ in the marker; a raw LIKE would make %WIDGET:header% match %WIDGET:header-sticky%.
    marker = _marker(name)
    layouts = db.query(CmsLayout).filter(CmsLayout.layout_content.contains(marker, autoescape=True)).count()
    pages = db.query(CmsPage).filter(CmsPage.page_content.contains(marker, autoescape=True)).count()
    return layouts, pages


def _serialize(widget: CmsWidget, refs: tuple[int, int] | None = None) -> dict:
    layouts, pages = refs if refs else (0, 0)
    return {"id": widget.id, "name": widget.name, "value": widget.value or "", "used_in_layouts": layouts, "used_in_pages": pages}


def _find(db: Session, widget_id: int) -> CmsWidget:
    widget = db.get(CmsWidget, widget_id)
    if widget is None:
        raise ApiError(404, "error.widget.not_found")
    return widget


def _unique(db: Session, name: str, widget_id: int | None = None):
    q = db.query(CmsWidget).filter(CmsWidget.name == name)
    if widget_id is not None:
        q = q.filter(CmsWidget.id != widget_id)
    if q.first():
        raise ApiError(409, "error.widget.name_exists")


def _block_if_referenced(db: Session, name: str, error_key: str):
    layouts, pages = _references(db, name)
    if layouts or pages:
        raise ApiError(409, error_key, layouts, pages)


def list_widgets(db: Session) -> list[dict]:
    return [_serialize(w, _references(db, w.name)) for w in db.query(CmsWidget).order_by(CmsWidget.name)]


def get_widget(db: Session, widget_id: int) -> dict:
    return _serialize(_find(db, widget_id))


def create_widget(db: Session, dto: CmsWidgetCreateDTO) -> dict:
    _unique(db, dto.name)
    widget = CmsWidget(name=dto.name, value=dto.value)
    db.add(widget)
    db.commit()
    db.refresh(widget)
    return _serialize(widget)


def update_widget(db: Session, widget_id: int, dto: CmsWidgetUpdateDTO) -> dict:
    widget = _find(db, widget_id)
    _unique(db, dto.name, widget_id)
    if widget.name != dto.name:     # renaming would break the %WIDGET:old% references
        _block_if_referenced(db, widget.name, "error.widget.rename_in_use")
    widget.name, widget.value = dto.name, dto.value
    db.commit()
    db.refresh(widget)
    return _serialize(widget)


def delete_widget(db: Session, widget_id: int) -> None:
    widget = _find(db, widget_id)
    _block_if_referenced(db, widget.name, "error.widget.delete_in_use")
    db.delete(widget)
    db.commit()
