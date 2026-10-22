import hashlib
import secrets
from datetime import datetime

from sqlalchemy.orm import Session

from app.entities.api_token import ApiToken
from app.entities.user import User
from app.errors import ApiError

TOKEN_PREFIX = "ncms_"
MAX_ACTIVE_TOKENS = 10


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _now() -> datetime:
    return datetime.now().replace(microsecond=0)


def _to_dict(t: ApiToken) -> dict:
    return {"id": t.id, "name": t.name, "prefix": t.prefix, "created_at": t.created_at, "last_used_at": t.last_used_at}


def _active(db: Session, login: str):
    return db.query(ApiToken).filter(ApiToken.login == login, ApiToken.revoked_at.is_(None))


def list_tokens(db: Session, user: User) -> list[dict]:
    return [_to_dict(t) for t in _active(db, user.login).order_by(ApiToken.created_at.desc(), ApiToken.id.desc())]


def create_token(db: Session, user: User, name: str) -> dict:
    """Creates a token for the signed-in user and returns it in clear: the only time it can be read."""
    if _active(db, user.login).count() >= MAX_ACTIVE_TOKENS:
        raise ApiError(409, "error.token.too_many", MAX_ACTIVE_TOKENS)
    raw = TOKEN_PREFIX + secrets.token_urlsafe(32)
    token = ApiToken(login=user.login, name=name.strip(), token_hash=_hash(raw), prefix=raw[:len(TOKEN_PREFIX) + 4], created_at=_now())
    db.add(token)
    db.commit()
    return {**_to_dict(token), "token": raw}


def revoke_token(db: Session, user: User, token_id: int) -> None:
    """Each user revokes only their own tokens (someone else's id answers 404, as if it did not exist)."""
    token = _active(db, user.login).filter(ApiToken.id == token_id).first()
    if token is None:
        raise ApiError(404, "error.token.not_found")
    token.revoked_at = _now()
    db.commit()


def user_for_token(db: Session, raw: str) -> User | None:
    """The active user behind a token, or None (unknown, revoked, or the user was deleted). Records the use."""
    if not raw.startswith(TOKEN_PREFIX):
        return None
    token = db.query(ApiToken).filter(ApiToken.token_hash == _hash(raw), ApiToken.revoked_at.is_(None)).first()
    if token is None:
        return None
    user = db.get(User, token.login)
    if user is None or user.deleted:
        return None
    token.last_used_at = _now()
    db.commit()
    return user
