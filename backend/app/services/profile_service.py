from sqlalchemy.orm import Session

from app.dtos.profile_dto import ProfileCreateDTO, ProfileUpdateDTO
from app.entities.privilege import Privilege
from app.entities.profile import Profile
from app.entities.user import User, user_x_profile
from app.errors import ApiError


def _is_super(user: User) -> bool:
    return "ALL" in user.privileges


def _codes(profile: Profile) -> set[str]:
    return {p.code for p in profile.privileges}


def _serialize(profile: Profile) -> dict:
    return {
        "id": profile.id,
        "name": profile.name,
        "editable": bool(profile.editable),
        "privilege_codes": sorted(_codes(profile)),
    }


def _find(db: Session, profile_id: int) -> Profile:
    profile = db.get(Profile, profile_id)
    if profile is None:
        raise ApiError(404, "error.profile.not_found")
    return profile


def _guard_editable(actor: User, profile: Profile):
    if not profile.editable:
        raise ApiError(403, "error.profile.system_locked")
    if "ALL" in _codes(profile) and not _is_super(actor):
        raise ApiError(403, "error.profile.super_locked")


def _privileges(db: Session, actor: User, codes: list[str], current: set[str] = frozenset()) -> list[Privilege]:
    """Requested privileges. Only privileges the actor holds can be GRANTED (ALL can grant anything)."""
    wanted = set(codes)
    found = db.query(Privilege).filter(Privilege.code.in_(wanted)).all() if wanted else []
    if len(found) != len(wanted):
        raise ApiError(400, "error.privilege.not_found")
    if not _is_super(actor):
        mine = actor.privileges
        denied = sorted(c for c in wanted - set(current) if c not in mine)
        if denied:
            raise ApiError(403, "error.profile.grant_denied", ", ".join(denied))
    return found


def list_privileges(db: Session) -> list[dict]:
    """Full catalog (read-only)."""
    rows = db.query(Privilege).order_by(Privilege.category, Privilege.code).all()
    return [{"code": p.code, "description": p.description, "category": p.category} for p in rows]


def grantable_privileges(db: Session, actor: User) -> list[dict]:
    """Privileges the actor can grant: all for a super user, otherwise only the ones they hold."""
    rows = list_privileges(db)
    if _is_super(actor):
        return rows
    mine = actor.privileges
    return [r for r in rows if r["code"] in mine]


def list_profiles(db: Session) -> list[dict]:
    return [_serialize(p) for p in db.query(Profile).order_by(Profile.name).all()]


def get_profile(db: Session, profile_id: int) -> dict:
    return _serialize(_find(db, profile_id))


def create_profile(db: Session, actor: User, dto: ProfileCreateDTO) -> dict:
    name = dto.name.strip()
    if db.query(Profile).filter(Profile.name == name).first():
        raise ApiError(409, "error.profile.name_exists")
    profile = Profile(name=name, editable=True, privileges=_privileges(db, actor, dto.privilege_codes))
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _serialize(profile)


def update_profile(db: Session, actor: User, profile_id: int, dto: ProfileUpdateDTO) -> dict:
    profile = _find(db, profile_id)
    _guard_editable(actor, profile)
    name = dto.name.strip()
    if db.query(Profile).filter(Profile.name == name, Profile.id != profile_id).first():
        raise ApiError(409, "error.profile.name_exists")
    profile.name = name
    profile.privileges = _privileges(db, actor, dto.privilege_codes, current=_codes(profile))
    db.commit()
    db.refresh(profile)
    return _serialize(profile)


def delete_profile(db: Session, actor: User, profile_id: int) -> None:
    profile = _find(db, profile_id)
    _guard_editable(actor, profile)
    # The table has no foreign keys: referential integrity is enforced here.
    in_use = (db.query(User).join(user_x_profile, user_x_profile.c.login == User.login)
              .filter(user_x_profile.c.profile == profile_id, User.deleted.is_(False)).count())
    if in_use:
        raise ApiError(409, "error.profile.in_use", in_use)
    # Only links from soft-deleted users remain: remove them so no orphans are left.
    db.execute(user_x_profile.delete().where(user_x_profile.c.profile == profile_id))
    db.delete(profile)   # also deletes its profile_x_privilege rows (secondary relationship)
    db.commit()
