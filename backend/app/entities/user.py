from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from app.db import Base

user_x_profile = Table(
    "user_x_profile", Base.metadata,
    Column("login", String(64), ForeignKey("users.login"), primary_key=True),
    Column("profile", Integer, ForeignKey("profile.id"), primary_key=True),
)


class User(Base):
    """Usuario del backoffice. password = SHA-256(salt + clave) en hex (compatible con el sistema Comtor)."""
    __tablename__ = "users"

    login = Column(String(64), primary_key=True)
    password = Column(String(256), nullable=False)
    salt = Column(String(64), nullable=False)
    name = Column(String(128), nullable=False)
    email = Column(String(64))
    deleted = Column(Boolean, nullable=False, default=False, index=True)

    profiles = relationship("Profile", secondary=user_x_profile, lazy="selectin")

    @property
    def privileges(self) -> set[str]:
        """Unión de los privilegios de todos sus perfiles."""
        return {p.code for profile in self.profiles for p in profile.privileges}
