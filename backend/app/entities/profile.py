from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from app.db import Base

profile_x_privilege = Table(
    "profile_x_privilege", Base.metadata,
    Column("profile", Integer, ForeignKey("profile.id"), primary_key=True),
    Column("privilege", String(64), ForeignKey("privilege.code"), primary_key=True),
)


class Profile(Base):
    """Perfil = grupo de privilegios."""
    __tablename__ = "profile"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    editable = Column(Boolean, nullable=False)

    privileges = relationship("Privilege", secondary=profile_x_privilege, lazy="selectin")
