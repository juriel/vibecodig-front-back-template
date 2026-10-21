"""Media uploads from the page editor: the file goes to the VFS (like the original CMS) and is served at /media/<folder>/<name>."""
import re
import unicodedata
import uuid
from datetime import datetime
from pathlib import Path, PurePath

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.entities.cms_media import MediaFile, MediaFolder, Vfs
from app.errors import ApiError
from app.services.cms_public_service import VFS_PATH

MAX_BYTES = 15 * 1024 * 1024
VFS_PREFIX = "cms"               # files land in VFS_PATH/cms/aa/bb/cc/dd/<uuid> (same layout as the original CMS)
# extension → (content type, folder). Only images and documents: nothing that could run on this origin.
ALLOWED = {
    "png": ("image/png", "imagenes"), "jpg": ("image/jpeg", "imagenes"), "jpeg": ("image/jpeg", "imagenes"),
    "gif": ("image/gif", "imagenes"), "webp": ("image/webp", "imagenes"), "svg": ("image/svg+xml", "imagenes"),
    "pdf": ("application/pdf", "documentos"),
}


def _safe_name(filename: str) -> tuple[str, str]:
    """('contrato-servicios', 'pdf') from 'Contrato de Servicios.PDF': no accents, spaces or path parts."""
    name = PurePath(filename or "").name
    stem, _, ext = name.rpartition(".")
    stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    stem = re.sub(r"[^A-Za-z0-9_-]+", "-", stem).strip("-").lower()[:80] or "archivo"
    return stem, ext.lower()


def _folder(db: Session, name: str) -> MediaFolder:
    folder = db.query(MediaFolder).filter(MediaFolder.name == name).first()
    if folder is None:
        folder = MediaFolder(name=name)
        db.add(folder)
        db.flush()
    return folder


def _unique_filename(db: Session, folder: MediaFolder, stem: str, ext: str) -> str:
    """contrato.pdf, contrato-2.pdf, contrato-3.pdf... within the folder (uploads never overwrite)."""
    n = 1
    while True:
        candidate = f"{stem}.{ext}" if n == 1 else f"{stem}-{n}.{ext}"
        if not db.query(MediaFile).filter(MediaFile.mediamanager_folder == folder.id, MediaFile.filename == candidate).first():
            return candidate
        n += 1


def _serialize(file: MediaFile, folder_name: str) -> dict:
    kind = "image" if (file.content_type or "").startswith("image/") else "document"
    return {"id": file.id, "name": file.filename, "src": f"/media/{folder_name}/{file.filename}", "type": kind}


def upload(db: Session, upload_file: UploadFile) -> dict:
    stem, ext = _safe_name(upload_file.filename)
    if ext not in ALLOWED:
        raise ApiError(400, "error.media.type_not_allowed")
    data = upload_file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ApiError(400, "error.media.too_large", MAX_BYTES // (1024 * 1024))
    if not data:
        raise ApiError(400, "error.media.empty")
    content_type, folder_name = ALLOWED[ext]

    file_id = str(uuid.uuid4())
    rel = f"/{VFS_PREFIX}/{file_id[0:2]}/{file_id[2:4]}/{file_id[4:6]}/{file_id[6:8]}/{file_id}"
    target = Path(VFS_PATH) / rel.lstrip("/")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    try:
        folder = _folder(db, folder_name)
        filename = _unique_filename(db, folder, stem, ext)
        db.add(Vfs(uuid=file_id, content_type=content_type, path=rel, extension=ext, filename=filename, type="media-manager"))
        file = MediaFile(vfs=file_id, mediamanager_folder=folder.id, filename=filename, uploaded_at=datetime.now(), content_type=content_type)
        db.add(file)
        db.commit()
    except Exception:
        db.rollback()
        target.unlink(missing_ok=True)
        raise
    return _serialize(file, folder_name)


def list_files(db: Session) -> list[dict]:
    """Every uploaded file, newest first (the editor shows the images in its picker)."""
    folders = {f.id: f.name for f in db.query(MediaFolder)}
    files = db.query(MediaFile).order_by(MediaFile.uploaded_at.desc(), MediaFile.id.desc())
    return [_serialize(f, folders[f.mediamanager_folder]) for f in files if f.mediamanager_folder in folders]
