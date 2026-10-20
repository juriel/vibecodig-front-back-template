from fastapi import FastAPI
from app.db import Base, engine
import app.entities  # registra todos los modelos en Base antes de create_all
from app.routers import auth, user
# from app.routers import example

# Sub-app montada en /api por server.py (docs en /api/docs, schema en /api/openapi.json)
api = FastAPI(title="Project Name")


def startup():
    """Lo invoca el lifespan de server.py (una sub-app montada no recibe sus propios eventos)."""
    Base.metadata.create_all(engine)


api.include_router(auth.router)
api.include_router(user.router)
# api.include_router(example.router)
