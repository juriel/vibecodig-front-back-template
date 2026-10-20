from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.db import Base


class Example(Base):
    __tablename__ = "examples"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
