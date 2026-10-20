from sqlalchemy import Column, Integer, String, Text
from app.db import Base


class CmsWidget(Base):
    """Reusable HTML fragment; inserted with %WIDGET:name% in layouts and pages."""
    __tablename__ = "cms_widget"

    id = Column(Integer, primary_key=True)
    name = Column(String(256), nullable=False)
    value = Column(Text)
