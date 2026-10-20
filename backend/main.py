from fastapi import FastAPI
from app.db import Base, engine
from app.errors import ApiError, api_error_handler
import app.entities  # registers every model in Base before create_all
from app.routers import auth, cms_admin, profile, user
# from app.routers import example

# Sub-app mounted at /api by server.py (docs at /api/docs, schema at /api/openapi.json)
api = FastAPI(title="Project Name")
api.add_exception_handler(ApiError, api_error_handler)


def startup():
    """Called by server.py's lifespan (a mounted sub-app does not receive its own startup events)."""
    Base.metadata.create_all(engine)


api.include_router(auth.router)
api.include_router(user.router)
api.include_router(profile.router)
api.include_router(cms_admin.router)
# api.include_router(example.router)
