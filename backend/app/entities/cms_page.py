from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from app.db import Base


class CmsPage(Base):
    """Public site page, served at /<url>.page inside its layout."""
    __tablename__ = "cms_page"

    id = Column(Integer, primary_key=True)
    cms_layout = Column(Integer, ForeignKey("cms_layout.id"), nullable=False, index=True)
    url = Column(String(128), nullable=False)
    title = Column(String(128))
    subtitle = Column(String(128))
    page_content = Column(Text)
    keywords = Column(String(1024))
    css = Column(Text)
    javascript = Column(Text)
    creation_date = Column(DateTime, nullable=False)
    last_update_date = Column(DateTime, nullable=False)
    owner = Column(String(64), ForeignKey("users.login"), nullable=False, index=True)
    is_index = Column(Integer, nullable=False, default=0)


class PageXRegisteredUserGroup(Base):
    """Restricts a page to registered-user groups (private pages; not supported by this panel yet)."""
    __tablename__ = "page_x_registered_user_group"

    id = Column(Integer, primary_key=True)
    cms_page = Column(Integer, ForeignKey("cms_page.id"), nullable=False, index=True)
    cms_registered_user_group = Column(Integer, nullable=False, index=True)
