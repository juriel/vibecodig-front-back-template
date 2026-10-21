from fastapi import FastAPI
from sqlalchemy import inspect, text
from app.db import Base, engine
from app.errors import ApiError, api_error_handler
import app.entities  # registers every model in Base before create_all
from app.routers import ai, auth, cms_admin, profile, user
# from app.routers import example

# Sub-app mounted at /api by server.py (docs at /api/docs, schema at /api/openapi.json)
api = FastAPI(title="Project Name")
api.add_exception_handler(ApiError, api_error_handler)


def _add_missing_columns():
    """create_all only creates missing tables: columns added later to a table of this app are added here."""
    added = {"user_preference": {"palette": "VARCHAR(16) NULL", "brand": "VARCHAR(7) NULL", "accent": "VARCHAR(7) NULL"}}
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, columns in added.items():
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, ddl in columns.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


def startup():
    """Called by server.py's lifespan (a mounted sub-app does not receive its own startup events)."""
    Base.metadata.create_all(engine)
    _add_missing_columns()


api.include_router(auth.router)
api.include_router(user.router)
api.include_router(profile.router)
api.include_router(cms_admin.router)
api.include_router(ai.router)
# api.include_router(example.router)
