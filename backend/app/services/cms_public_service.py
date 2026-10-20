"""Public CMS resources: CSS/JS (global and per page) and media manager files."""
import os
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from app.entities.cms_asset import CmsCss, CmsJs
from app.entities.cms_media import MediaFile, MediaFolder, Vfs
from app.services.cms_render_service import find_page, is_private

# Virtual file system root; `vfs.path` is relative to it (e.g. /titi-cms-comtor/02/d5/.../uuid).
VFS_PATH = os.environ.get("VFS_PATH", "/opt/vfs")


def css_content(db: Session, path: str) -> Optional[str]:
    """Global CSS by `path` or, if none, the CSS of the page `<url>.css`."""
    css = db.query(CmsCss).filter(CmsCss.path == path).first()
    if css is not None:
        return css.content or ""
    return _page_asset(db, path, ".css", "css")


def js_content(db: Session, path: str) -> Optional[str]:
    js = db.query(CmsJs).filter(CmsJs.path == path).first()
    if js is not None:
        return js.content or ""
    return _page_asset(db, path, ".js", "javascript")


def _page_asset(db: Session, path: str, ext: str, field: str) -> Optional[str]:
    if not path.endswith(ext):
        return None
    page = find_page(db, path[: -len(ext)])
    if page is None or is_private(db, page):
        return None
    return getattr(page, field) or None


def media_file(db: Session, folder_name: str, filename: str) -> Optional[tuple[Path, str]]:
    """(disk path, content-type) of /media/<folder>/<file>, or None. Never leaves VFS_PATH."""
    folder = db.query(MediaFolder).filter(MediaFolder.name == folder_name).first()
    if folder is None:
        return None
    file = db.query(MediaFile).filter(MediaFile.mediamanager_folder == folder.id, MediaFile.filename == filename).first()
    if file is None or not file.vfs:
        return None
    vfs = db.get(Vfs, file.vfs)
    if vfs is None or not vfs.path:
        return None
    root = Path(VFS_PATH).resolve()
    target = (root / vfs.path.lstrip("/")).resolve()
    if root not in target.parents or not target.is_file():
        return None
    return target, file.content_type or vfs.content_type or "application/octet-stream"
