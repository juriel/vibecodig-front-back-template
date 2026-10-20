from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String(64), nullable=False, unique=True)
    name = Column(String(128), nullable=False)
    password_hash = Column(String(255), nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        data = super().to_dict()
        data.pop("password_hash")
        return data
