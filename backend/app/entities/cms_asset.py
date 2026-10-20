from sqlalchemy import Column, Integer, String, Text
from app.db import Base


class CmsCss(Base):
    """Global CSS: external URL (`url`) or own content served at /css/<path>."""
    __tablename__ = "cms_css"

    code = Column(String(32), primary_key=True)
    name = Column(String(128))
    active = Column(Integer)
    content = Column(Text)
    url = Column(String(256))
    order_show = Column(Integer)
    path = Column(String(512))


class CmsJs(Base):
    """Global JS: external URL (`url`) or own content served at /js/<path>; `type` = header | footer."""
    __tablename__ = "cms_js"

    code = Column(String(32), primary_key=True)
    name = Column(String(128))
    active = Column(Integer)
    content = Column(Text)
    url = Column(String(256))
    order_show = Column(Integer)
    type = Column(String(64))
    path = Column(String(512))
