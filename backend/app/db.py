import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

DATABASE_URL = os.environ.get('DATABASE_URL', 'mysql+pymysql://user:password@localhost/dbname')

engine = create_engine(DATABASE_URL, pool_pre_ping=True)  # MySQL closes idle connections
SessionLocal = sessionmaker(bind=engine)


class BaseModel:
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self):
        fields = ", ".join(f"{c.name}={getattr(self, c.name)!r}" for c in self.__table__.columns)
        return f"<{self.__class__.__name__} {fields}>"


Base = declarative_base(cls=BaseModel)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
