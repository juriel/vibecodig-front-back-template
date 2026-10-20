"""Crea un usuario para entrar al panel (pide la contraseña por teclado).

Usa el esquema existente: users (SHA-256 con salt) + user_x_profile.
Uso (desde la raíz, con el .venv activo):
    python backend/create_user.py <login> "<Nombre>" [--profile ID]

--profile: id del perfil a asignar (default 1 = Administrator, con el privilegio ALL).
"""
import argparse
import getpass
import secrets
import string
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db import SessionLocal
import app.entities  # noqa: F401  registra los modelos
from app.entities.profile import Profile
from app.entities.user import User
from app.security import hash_password

MIN_PASSWORD = 10


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("login")
    ap.add_argument("name")
    ap.add_argument("--profile", type=int, default=1)
    args = ap.parse_args()

    db = SessionLocal()
    try:
        if db.get(User, args.login):
            sys.exit(f"El usuario '{args.login}' ya existe")
        profile = db.get(Profile, args.profile)
        if not profile:
            sys.exit(f"No existe el perfil {args.profile}")
        password = getpass.getpass("Contraseña: ")
        if len(password) < MIN_PASSWORD:
            sys.exit(f"La contraseña debe tener al menos {MIN_PASSWORD} caracteres")
        if password != getpass.getpass("Repite la contraseña: "):
            sys.exit("Las contraseñas no coinciden")
        salt = "".join(secrets.choice(string.ascii_uppercase) for _ in range(6))
        db.add(User(login=args.login, name=args.name, salt=salt, password=hash_password(salt, password),
                    deleted=False, profiles=[profile]))
        db.commit()
        print(f"Usuario '{args.login}' creado con el perfil '{profile.name}'")
    finally:
        db.close()


if __name__ == "__main__":
    main()
