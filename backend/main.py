import os
from fastapi import Depends, FastAPI
from starlette.middleware.sessions import SessionMiddleware
from app.db import Base, engine
import app.entities  # registra todos los modelos en Base antes de create_all
from app.routers import auth, example
from app.services.auth_service import current_user

# Sub-app montada en /api por server.py (docs en /api/docs, schema en /api/openapi.json)
api = FastAPI(title="Project Name")
# Sesión en cookie firmada con SECRET_KEY; COOKIE_SECURE=1 en producción (solo HTTPS)
api.add_middleware(SessionMiddleware, secret_key=os.environ["SECRET_KEY"], max_age=8 * 3600,
                   same_site="lax", https_only=os.environ.get("COOKIE_SECURE") == "1")


def startup():
    """Lo invoca el lifespan de server.py (una sub-app montada no recibe sus propios eventos)."""
    Base.metadata.create_all(engine)


api.include_router(auth.router)
# Rutas protegidas: requieren sesión iniciada
api.include_router(example.router, dependencies=[Depends(current_user)])
