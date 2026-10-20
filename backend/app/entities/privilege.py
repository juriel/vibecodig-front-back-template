from sqlalchemy import Column, String
from app.db import Base


class Privilege(Base):
    """Permiso granular (p. ej. ADD_USER). El código 'ALL' es el super-privilegio."""
    __tablename__ = "privilege"

    code = Column(String(64), primary_key=True)
    description = Column(String(256), nullable=False)
    category = Column(String(128), nullable=False, index=True)
