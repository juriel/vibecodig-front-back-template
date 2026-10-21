"""CMS administration API: pages, layouts, widgets, global CSS/JS and redirects (under /api/cms)."""
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.dtos.cms_asset_dto import CmsCssCreateDTO, CmsCssUpdateDTO, CmsJsCreateDTO, CmsJsUpdateDTO
from app.dtos.cms_layout_dto import CmsLayoutCreateDTO, CmsLayoutUpdateDTO
from app.dtos.cms_page_dto import CmsPageCreateDTO, CmsPageUpdateDTO
from app.dtos.cms_redirect_dto import CmsRedirectCreateDTO, CmsRedirectUpdateDTO
from app.dtos.cms_widget_dto import CmsWidgetCreateDTO, CmsWidgetUpdateDTO
from app.entities.user import User
from app.security import require_privilege
from app.services import cms_asset_service, cms_layout_service, cms_media_service, cms_page_service, cms_redirect_service, cms_widget_service
from app.services.cms_asset_service import CSS, JS

router = APIRouter(prefix="/cms", tags=["cms"])

# ---------------- Pages (privileges *_CMS_PAGE) ----------------
# Static routes before dynamic ones (/{id})


@router.get("/pages/layouts")
def page_layouts(db: Session = Depends(get_db), _: User = Depends(require_privilege("ADD_CMS_PAGE", "EDIT_CMS_PAGE"))):
    return cms_page_service.list_layouts(db)


@router.get("/pages/editor-assets")
def page_editor_assets(db: Session = Depends(get_db), _: User = Depends(require_privilege("ADD_CMS_PAGE", "EDIT_CMS_PAGE"))):
    return cms_page_service.editor_assets(db)


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


# ---------------- Global CSS and JS (no privileges of their own: they use the layout ones, *_CMS_LAYOUT) ----------------

@router.get("/css", dependencies=[Depends(require_privilege("VIEW_CMS_LAYOUT"))])
def list_css(db: Session = Depends(get_db)):
    return cms_asset_service.list_assets(db, CSS)


@router.post("/css", status_code=201, dependencies=[Depends(require_privilege("ADD_CMS_LAYOUT"))])
def create_css(body: CmsCssCreateDTO, db: Session = Depends(get_db)):
    return cms_asset_service.create_asset(db, CSS, body)


@router.get("/css/{code}", dependencies=[Depends(require_privilege("VIEW_CMS_LAYOUT"))])
def get_css(code: str, db: Session = Depends(get_db)):
    return cms_asset_service.get_asset(db, CSS, code)


@router.put("/css/{code}", dependencies=[Depends(require_privilege("EDIT_CMS_LAYOUT"))])
def update_css(code: str, body: CmsCssUpdateDTO, db: Session = Depends(get_db)):
    return cms_asset_service.update_asset(db, CSS, code, body)


@router.delete("/css/{code}", status_code=204, dependencies=[Depends(require_privilege("DELETE_CMS_LAYOUT"))])
def delete_css(code: str, db: Session = Depends(get_db)):
    cms_asset_service.delete_asset(db, CSS, code)


@router.get("/js", dependencies=[Depends(require_privilege("VIEW_CMS_LAYOUT"))])
def list_js(db: Session = Depends(get_db)):
    return cms_asset_service.list_assets(db, JS)


@router.post("/js", status_code=201, dependencies=[Depends(require_privilege("ADD_CMS_LAYOUT"))])
def create_js(body: CmsJsCreateDTO, db: Session = Depends(get_db)):
    return cms_asset_service.create_asset(db, JS, body)


@router.get("/js/{code}", dependencies=[Depends(require_privilege("VIEW_CMS_LAYOUT"))])
def get_js(code: str, db: Session = Depends(get_db)):
    return cms_asset_service.get_asset(db, JS, code)


@router.put("/js/{code}", dependencies=[Depends(require_privilege("EDIT_CMS_LAYOUT"))])
def update_js(code: str, body: CmsJsUpdateDTO, db: Session = Depends(get_db)):
    return cms_asset_service.update_asset(db, JS, code, body)


@router.delete("/js/{code}", status_code=204, dependencies=[Depends(require_privilege("DELETE_CMS_LAYOUT"))])
def delete_js(code: str, db: Session = Depends(get_db)):
    cms_asset_service.delete_asset(db, JS, code)


# ---------------- Redirects (no privileges of their own: they use the page ones, *_CMS_PAGE) ----------------

@router.get("/redirects", dependencies=[Depends(require_privilege("VIEW_CMS_PAGE"))])
def list_redirects(db: Session = Depends(get_db)):
    return cms_redirect_service.list_redirects(db)


@router.post("/redirects", status_code=201, dependencies=[Depends(require_privilege("ADD_CMS_PAGE"))])
def create_redirect(body: CmsRedirectCreateDTO, db: Session = Depends(get_db)):
    return cms_redirect_service.create_redirect(db, body)


@router.get("/redirects/{redirect_id}", dependencies=[Depends(require_privilege("VIEW_CMS_PAGE"))])
def get_redirect(redirect_id: int, db: Session = Depends(get_db)):
    return cms_redirect_service.get_redirect(db, redirect_id)


@router.put("/redirects/{redirect_id}", dependencies=[Depends(require_privilege("EDIT_CMS_PAGE"))])
def update_redirect(redirect_id: int, body: CmsRedirectUpdateDTO, db: Session = Depends(get_db)):
    return cms_redirect_service.update_redirect(db, redirect_id, body)


@router.delete("/redirects/{redirect_id}", status_code=204, dependencies=[Depends(require_privilege("DELETE_CMS_PAGE"))])
def delete_redirect(redirect_id: int, db: Session = Depends(get_db)):
    cms_redirect_service.delete_redirect(db, redirect_id)


# ---------------- Media (uploads from the page editor; privileges *_FOLDER of the media manager) ----------------

@router.get("/media", dependencies=[Depends(require_privilege("VIEW_FOLDER", "ADD_FOLDER"))])
def list_media(db: Session = Depends(get_db)):
    return cms_media_service.list_files(db)


@router.post("/media", status_code=201, dependencies=[Depends(require_privilege("ADD_FOLDER"))])
def upload_media(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return cms_media_service.upload(db, file)
