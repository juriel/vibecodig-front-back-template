"""CMS administration API: pages, layouts and widgets (under /api/cms)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dtos.cms_layout_dto import CmsLayoutCreateDTO, CmsLayoutUpdateDTO
from app.dtos.cms_page_dto import CmsPageCreateDTO, CmsPageUpdateDTO
from app.dtos.cms_widget_dto import CmsWidgetCreateDTO, CmsWidgetUpdateDTO
from app.entities.user import User
from app.security import require_privilege
from app.services import cms_layout_service, cms_page_service, cms_widget_service

router = APIRouter(prefix="/cms", tags=["cms"])

# ---------------- Pages (privileges *_CMS_PAGE) ----------------
# Static routes before dynamic ones (/{id})


@router.get("/pages/layouts")
def page_layouts(db: Session = Depends(get_db), _: User = Depends(require_privilege("ADD_CMS_PAGE", "EDIT_CMS_PAGE"))):
    return cms_page_service.list_layouts(db)


@router.get("/pages", dependencies=[Depends(require_privilege("VIEW_CMS_PAGE"))])
def list_pages(db: Session = Depends(get_db)):
    return cms_page_service.list_pages(db)


@router.post("/pages", status_code=201)
def create_page(body: CmsPageCreateDTO, db: Session = Depends(get_db), actor: User = Depends(require_privilege("ADD_CMS_PAGE"))):
    return cms_page_service.create_page(db, actor, body)


@router.get("/pages/{page_id}", dependencies=[Depends(require_privilege("VIEW_CMS_PAGE"))])
def get_page(page_id: int, db: Session = Depends(get_db)):
    return cms_page_service.get_page(db, page_id)


@router.put("/pages/{page_id}", dependencies=[Depends(require_privilege("EDIT_CMS_PAGE"))])
def update_page(page_id: int, body: CmsPageUpdateDTO, db: Session = Depends(get_db)):
    return cms_page_service.update_page(db, page_id, body)


@router.delete("/pages/{page_id}", status_code=204, dependencies=[Depends(require_privilege("DELETE_CMS_PAGE"))])
def delete_page(page_id: int, db: Session = Depends(get_db)):
    cms_page_service.delete_page(db, page_id)


# ---------------- Layouts (privileges *_CMS_LAYOUT) ----------------

@router.get("/layouts/types")
def layout_types(db: Session = Depends(get_db), _: User = Depends(require_privilege("ADD_CMS_LAYOUT", "EDIT_CMS_LAYOUT"))):
    return cms_layout_service.list_types(db)


@router.get("/layouts", dependencies=[Depends(require_privilege("VIEW_CMS_LAYOUT"))])
def list_layouts(db: Session = Depends(get_db)):
    return cms_layout_service.list_layouts(db)


@router.post("/layouts", status_code=201, dependencies=[Depends(require_privilege("ADD_CMS_LAYOUT"))])
def create_layout(body: CmsLayoutCreateDTO, db: Session = Depends(get_db)):
    return cms_layout_service.create_layout(db, body)


@router.get("/layouts/{layout_id}", dependencies=[Depends(require_privilege("VIEW_CMS_LAYOUT"))])
def get_layout(layout_id: int, db: Session = Depends(get_db)):
    return cms_layout_service.get_layout(db, layout_id)


@router.put("/layouts/{layout_id}", dependencies=[Depends(require_privilege("EDIT_CMS_LAYOUT"))])
def update_layout(layout_id: int, body: CmsLayoutUpdateDTO, db: Session = Depends(get_db)):
    return cms_layout_service.update_layout(db, layout_id, body)


@router.delete("/layouts/{layout_id}", status_code=204, dependencies=[Depends(require_privilege("DELETE_CMS_LAYOUT"))])
def delete_layout(layout_id: int, db: Session = Depends(get_db)):
    cms_layout_service.delete_layout(db, layout_id)


# ---------------- Widgets (no privileges of their own: they use the page ones, *_CMS_PAGE) ----------------

@router.get("/widgets", dependencies=[Depends(require_privilege("VIEW_CMS_PAGE"))])
def list_widgets(db: Session = Depends(get_db)):
    return cms_widget_service.list_widgets(db)


@router.post("/widgets", status_code=201, dependencies=[Depends(require_privilege("ADD_CMS_PAGE"))])
def create_widget(body: CmsWidgetCreateDTO, db: Session = Depends(get_db)):
    return cms_widget_service.create_widget(db, body)


@router.get("/widgets/{widget_id}", dependencies=[Depends(require_privilege("VIEW_CMS_PAGE"))])
def get_widget(widget_id: int, db: Session = Depends(get_db)):
    return cms_widget_service.get_widget(db, widget_id)


@router.put("/widgets/{widget_id}", dependencies=[Depends(require_privilege("EDIT_CMS_PAGE"))])
def update_widget(widget_id: int, body: CmsWidgetUpdateDTO, db: Session = Depends(get_db)):
    return cms_widget_service.update_widget(db, widget_id, body)


@router.delete("/widgets/{widget_id}", status_code=204, dependencies=[Depends(require_privilege("DELETE_CMS_PAGE"))])
def delete_widget(widget_id: int, db: Session = Depends(get_db)):
    cms_widget_service.delete_widget(db, widget_id)
