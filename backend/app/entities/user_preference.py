from sqlalchemy import Column, ForeignKey, String
from app.db import Base


class UserPreference(Base):
    """Per-user panel preferences (theme and colors). A separate table: the original `users` table is used as is."""
    __tablename__ = "user_preference"

    login = Column(String(64), ForeignKey("users.login"), primary_key=True)
    theme = Column(String(8), nullable=False, default="light")
    palette = Column(String(16))     # preset id (e.g. "titi") or "custom"; empty = default
    brand = Column(String(7))        # #rrggbb, only for "custom"
    accent = Column(String(7))
