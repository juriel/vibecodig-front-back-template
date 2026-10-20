# Skill: Init Project

Cuando el usuario invoque `/backend-init-project`, completar la configuración inicial del proyecto.

## Proceso

### 1. Preguntar al usuario
- Nombre del proyecto
- Descripción / objetivo
- Nombre de la DB (PostgreSQL)
- Puerto (default: 8000; lo usa `server.py`/uvicorn)
- Módulos iniciales a crear

### 2. Actualizar `CLAUDE.md` (raíz)
- Reemplazar `[NOMBRE DEL PROYECTO]` con el nombre real
- Completar `## Objetivo`
- Listar módulos en `## Módulos`
- Actualizar el `DATABASE_URL` de ejemplo en `## Cómo correr`

### 3. Actualizar `backend/app/db.py`
- Cambiar el `DATABASE_URL` default por el de este proyecto

### 4. Actualizar `backend/main.py` (sub-app `api`; se monta en `/api` desde `server.py`)
- Cambiar el `title` del FastAPI por el nombre real

### 5. Actualizar `.env.example`
- Poner el nombre de DB real

### 6. Crear módulos iniciales
Por cada módulo indicado, ejecutar el flujo de `/backend-new-module <nombre>`.

### 7. Limpiar archivos de ejemplo
- Eliminar `backend/app/routers/example.py`
- Eliminar `backend/app/services/example_service.py`
