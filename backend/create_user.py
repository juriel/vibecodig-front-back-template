"""Create a user to sign in to the panel (the password is asked on the terminal).

Uses the existing schema: users (salted SHA-256) + user_x_profile.
Usage (from the repository root, with the .venv active):
    python backend/create_user.py <login> "<Name>" [--profile ID]

--profile: id of the profile to assign (default 1 = Administrator, which has the ALL privilege).
Messages are translated using the LANG environment variable.
"""
import argparse
import getpass
import os
import secrets
import string
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db import SessionLocal
import app.entities  # noqa: F401  registers the models
from app.entities.profile import Profile
from app.entities.user import User
from app.i18n import negotiate, t
from app.security import hash_password

MIN_PASSWORD = 10
LANG = negotiate((os.environ.get("LANG") or "").replace("_", "-").split(".")[0])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("login")
    ap.add_argument("name")
    ap.add_argument("--profile", type=int, default=1)
    args = ap.parse_args()

    db = SessionLocal()
    try:
        if db.get(User, args.login):
            sys.exit(t("cli.user_exists", LANG, args.login))
        profile = db.get(Profile, args.profile)
        if not profile:
            sys.exit(t("cli.profile_not_found", LANG, args.profile))
        password = getpass.getpass(t("cli.password", LANG) + ": ")
        if len(password) < MIN_PASSWORD:
            sys.exit(t("cli.password_too_short", LANG, MIN_PASSWORD))
        if password != getpass.getpass(t("cli.password_repeat", LANG) + ": "):
            sys.exit(t("cli.password_mismatch", LANG))
        salt = "".join(secrets.choice(string.ascii_uppercase) for _ in range(6))
        db.add(User(login=args.login, name=args.name, salt=salt, password=hash_password(salt, password),
                    deleted=False, profiles=[profile]))
        db.commit()
        print(t("cli.user_created", LANG, args.login, profile.name))
    finally:
        db.close()


if __name__ == "__main__":
    main()
