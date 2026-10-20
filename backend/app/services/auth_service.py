from sqlalchemy.orm import Session

from app.dtos.auth_dto import LoginDTO
from app.entities.user import User
from app.errors import ApiError
from app.security import create_token, verify_password


def session_data(user: User, token: str | None = None) -> dict:
    data = {
        "user": {"login": user.login, "name": user.name, "email": user.email},
        "privileges": sorted(user.privileges),
    }
    if token:
        data["token"] = token
    return data


def login(db: Session, dto: LoginDTO) -> dict:
    user = db.get(User, dto.login)
    # Same error for unknown user, deleted user or wrong password (do not reveal which one).
    if user is None or user.deleted or not verify_password(user, dto.password):
        raise ApiError(401, "error.invalid_credentials")
    return session_data(user, create_token(user.login))
