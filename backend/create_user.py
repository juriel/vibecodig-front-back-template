"""Crea un usuario para entrar a la app (pide la contraseña por teclado).

Uso (desde la raíz, con el .venv activo):
    python backend/create_user.py <login> "<Nombre>"
"""
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db import Base, engine, SessionLocal
import app.entities  # noqa: F401  registra los modelos para create_all
from app.entities.user import User
from app.services.auth_service import hash_password


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    login, name = sys.argv[1], sys.argv[2]
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if db.query(User).filter_by(login=login).first():
            sys.exit(f"El usuario '{login}' ya existe")
        password = getpass.getpass("Contraseña: ")
        if len(password) < 10:
            sys.exit("La contraseña debe tener al menos 10 caracteres")
        if password != getpass.getpass("Repite la contraseña: "):
            sys.exit("Las contraseñas no coinciden")
        db.add(User(login=login, name=name, password_hash=hash_password(password)))
        db.commit()
        print(f"Usuario '{login}' creado")
    finally:
        db.close()


if __name__ == "__main__":
    main()
