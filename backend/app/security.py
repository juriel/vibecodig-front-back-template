import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.entities.user import User
from app.errors import ApiError

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "480"))
_bearer = HTTPBearer(auto_error=False)


def _secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is missing from .env")
    return secret


def hash_password(salt: str, password: str) -> str:
    """SHA-256(salt + password) as hex: same scheme as the existing `users` table."""
    return hashlib.sha256((salt + password).encode()).hexdigest()


def verify_password(user: User, password: str) -> bool:
    return hmac.compare_digest(hash_password(user.salt, password), user.password)


def create_token(login: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": login, "exp": exp}, _secret(), algorithm=JWT_ALGORITHM)


def get_current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if cred is None:
        raise ApiError(401, "error.unauthenticated")
    try:
        login = jwt.decode(cred.credentials, _secret(), algorithms=[JWT_ALGORITHM])["sub"]
    except jwt.PyJWTError:
        raise ApiError(401, "error.unauthenticated")
    user = db.get(User, login)
    if user is None or user.deleted:
        raise ApiError(401, "error.unauthenticated")
    return user


def require_privilege(*codes: str):
    """Dependency: requires at least one of the privileges (or ALL). Usage: dependencies=[Depends(require_privilege('VIEW_USER'))]"""
    def checker(user: User = Depends(get_current_user)) -> User:
        privileges = user.privileges
        if "ALL" not in privileges and not privileges.intersection(codes):
            raise ApiError(403, "error.forbidden")
        return user
    return checker
