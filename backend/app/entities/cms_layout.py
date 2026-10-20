from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from app.db import Base


class CmsTypeLayout(Base):
    """Layout type (default, news, page...)."""
    __tablename__ = "cms_type_layout"

    code = Column(String(32), primary_key=True)
    type_name = Column(String(128))


class CmsLayout(Base):
    """Layout: HTML with markers %CONTENT%, %TITLE%, %WIDGET:name%... One per type is the default."""
    __tablename__ = "cms_layout"

    id = Column(Integer, primary_key=True)
    layout_name = Column(String(128), nullable=False)
    cms_type_layout = Column(String(32), ForeignKey("cms_type_layout.code"))
    layout_content = Column(Text)
    default_layout = Column(Boolean, default=False)
