# Skill: New Module

Cuando el usuario invoque `/backend-new-module <nombre>`, crear un módulo completo siguiendo estos pasos en orden.

`<nombre>` en minúscula para archivos y rutas, en PascalCase para clases.

---

> **Auth:** proteger el router con `dependencies=[Depends(require_privilege('VIEW_<NOMBRE>'))]` (importar de `app.security`) y los endpoints de escritura con `ADD_`/`EDIT_`/`DELETE_<NOMBRE>`. Los códigos deben existir en la tabla `privilege`.

---

> **Idioma del código e i18n:** todo el código, los comentarios, las rutas y los nombres van en **inglés**. Nunca se escriben mensajes literales en un `HTTPException`: se lanza `ApiError(status, "error.<nombre>.<causa>", *args)` y la clave se agrega a **ambos** catálogos (`frontend/web/assets/i18n/en.properties` y `es.properties`). Al terminar, ejecutar `python3 scripts/check_i18n.py`.

---

## 1. Crear entidad en `backend/app/entities/<nombre>.py`

Heredar de `Base`. Siempre incluir `id` (PK) y `created_at`.

```python
# backend/app/entities/<nombre>.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.db import Base


class <Nombre>(Base):
    __tablename__ = "<nombre>s"

    id = Column(Integer, primary_key=True, index=True)
    # campos del módulo...
    created_at = Column(DateTime, default=datetime.utcnow)
```

Luego registrar en `backend/app/entities/__init__.py`:
```python
from app.entities.<nombre> import <Nombre>
```

---

## 2. Crear DTOs en `backend/app/dtos/<nombre>_dto.py`

Un DTO por operación. Nombres con sufijo `DTO`. Solo los campos que el cliente envía (sin `id`, sin `created_at`).

```python
# backend/app/dtos/<nombre>_dto.py
from pydantic import BaseModel


class <Nombre>CreateDTO(BaseModel):
    # campos que recibe el POST...
```

Agregar export en `backend/app/dtos/__init__.py`:
```python
from app.dtos.<nombre>_dto import <Nombre>CreateDTO
```

---

## 3. Crear `backend/app/services/<nombre>_service.py`

El service recibe entidades (construidas por el mapper), nunca primitivos campo a campo.
Para casos con transformación especial de campos (ej. hashing), recibe el DTO y construye la entidad internamente.

```python
# backend/app/services/<nombre>_service.py
from sqlalchemy.orm import Session
from app.errors import ApiError
from app.repository import BaseRepository
from app.entities.<nombre> import <Nombre>


def list_items(db: Session):
    return [i.to_dict() for i in BaseRepository(db, <Nombre>).find_all()]


def create_item(db: Session, entity: <Nombre>):
    return BaseRepository(db, <Nombre>).save(entity).to_dict()


def get_item(db: Session, item_id: int):
    item = BaseRepository(db, <Nombre>).find(item_id)
    if not item:
        raise ApiError(404, "error.<nombre>.not_found")
    return item.to_dict()


def delete_item(db: Session, item_id: int):
    repo = BaseRepository(db, <Nombre>)
    if not repo.find(item_id):
        raise ApiError(404, "error.<nombre>.not_found")
    repo.delete(item_id)
```

---

## 4. Crear `backend/app/routers/<nombre>.py`

- Registrar el mapeo con `mapper.register(...)` al cargar el módulo (una sola vez)
- Usar `mapper.dto_to_entity(body)` antes de llamar al service
- Rutas estáticas (ej. `/buscar`) **antes** que dinámicas (ej. `/{id}`)

```python
# backend/app/routers/<nombre>.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.entities.<nombre> import <Nombre>
from app.dtos.<nombre>_dto import <Nombre>CreateDTO
from app.services import <nombre>_service
from app import mapper

mapper.register(<Nombre>CreateDTO, <Nombre>)

router = APIRouter(prefix="/<nombre>s", tags=["<nombre>s"])


@router.get("")
def list_items(db: Session = Depends(get_db)):
    return <nombre>_service.list_items(db)


@router.post("", status_code=201)
def create_item(body: <Nombre>CreateDTO, db: Session = Depends(get_db)):
    return <nombre>_service.create_item(db, mapper.dto_to_entity(body))


@router.get("/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    return <nombre>_service.get_item(db, item_id)


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    <nombre>_service.delete_item(db, item_id)
```

---

## 5. Montar en `backend/main.py` (sub-app `api`; se monta en `/api` desde `server.py`)

```python
from app.routers import <nombre>
api.include_router(<nombre>.router)
```

---

## 6. Actualizar `CLAUDE.md` (raíz)

- Agregar el módulo en **Módulos**
- Agregar las rutas en la tabla **Endpoints**
- Agregar los archivos en **Estructura**
