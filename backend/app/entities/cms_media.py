from sqlalchemy import Column, DateTime, Integer, String
from app.db import Base


class MediaFolder(Base):
    __tablename__ = "cms_mediamanager_folder"

    id = Column(Integer, primary_key=True)
    name = Column(String(256), nullable=False)


class MediaFile(Base):
    """Media manager file; the content lives on disk (VFS), referenced by `vfs` (uuid)."""
    __tablename__ = "cms_mediamanager_file"

    id = Column(Integer, primary_key=True)
    vfs = Column(String(64))
    mediamanager_folder = Column(Integer, nullable=False)
    filename = Column(String(256))
    uploaded_at = Column("datetime", DateTime)
    content_type = Column(String(128))


class Vfs(Base):
    """Virtual file system file: `path` is relative to the VFS root (VFS_PATH)."""
    __tablename__ = "vfs"

    uuid = Column(String(64), primary_key=True)
    content_type = Column(String(128))
    path = Column(String(512))
    extension = Column(String(8))
    filename = Column(String(256))
    type = Column(String(32))
