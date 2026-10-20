from sqlalchemy import Column, String
from app.db import Base


class Privilege(Base):
    """Granular permission (e.g. ADD_USER). The 'ALL' code is the super privilege."""
    __tablename__ = "privilege"

    code = Column(String(64), primary_key=True)
    description = Column(String(256), nullable=False)
    category = Column(String(128), nullable=False, index=True)
