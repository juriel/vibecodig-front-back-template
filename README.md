# vibecodig-front-back-template

Plantilla full-stack en un solo proyecto: **backend FastAPI** bajo `/api` y **frontend Lit + TypeScript** compilado con Webpack, ambos servidos por el mismo proceso y el mismo puerto.

- Backend: Python, FastAPI, SQLAlchemy, MariaDB/MySQL
- Frontend: Lit 3, @vaadin/router, Axios, Webpack 5
- Un único origen: sin CORS ni segundo servidor

## Requisitos
- Python 3.10+
- Node.js 18+ y npm
- MariaDB o MySQL

## Puesta en marcha
```bash
# 1. Base de datos (solo la primera vez)
mysql -u root -p -e "CREATE DATABASE <db_name> CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER '<db_user>'@'localhost' IDENTIFIED BY '<db_pass>'; GRANT ALL PRIVILEGES ON <db_name>.* TO '<db_user>'@'localhost'; FLUSH PRIVILEGES;"

# 2. Configuración y dependencias
cp .env.example .env          # editar DATABASE_URL
python3 -m venv .venv && source .venv/bin/activate
npm run install:all           # pip install -r requirements.txt + npm install en frontend/

# 3. Compilar y levantar
npm start                     # http://localhost:8000
```

| URL | Contenido |
|-----|-----------|
| `/` | Frontend (SPA) |
| `/dist/app.js` | JavaScript compilado por Webpack |
| `/api/...` | Backend |
| `/api/docs` | Swagger UI |
| `/api/openapi.json` | Esquema OpenAPI |

## Desarrollo
Dos terminales desde la raíz:
```bash
npm run dev:front   # webpack --watch → frontend/web/dist/app.js
npm run dev:back    # uvicorn con autoreload en :8000
```
El servidor no compila el frontend: tras cambiar código en `frontend/` hace falta `npm run build` o tener `dev:front` corriendo.

## Scripts (raíz)
| Script | Acción |
|--------|--------|
| `npm run install:all` | Instala dependencias de Python y del frontend |
| `npm run build` | Compila el frontend |
| `npm run dev:front` | Webpack en modo watch |
| `npm run dev:back` | Uvicorn con reload |
| `npm start` | Compila y sirve todo |

## Estructura
```
server.py                # entry point: monta el backend en /api y sirve el frontend
requirements.txt
.env.example
package.json             # scripts de la raíz
backend/
├── main.py              # sub-app FastAPI `api` (routers + create_all)
└── app/                 # db, entities, dtos, services, routers, mapper, repository
frontend/
├── src/                 # index.ts, app-root.ts, crud/ (framework genérico), modules/
└── web/                 # index.html y dist/ (generado)
.claude/commands/        # skills de Claude Code: backend-* y frontend-*
```

## Cómo funciona la integración
- `server.py` crea la app principal, monta el backend con `app.mount("/api", api)` y sirve `frontend/web/`.
- Cualquier ruta que no sea `/api/*` ni un archivo existente devuelve `index.html` (fallback SPA), así que recargar en `/example` funciona.
- El frontend usa `GlobalConfig.apiUrl = '/api/'`.
- Las rutas del backend se declaran **sin** prefijo `/api`.
- `create_all` se ejecuta en el lifespan de `server.py`, porque una sub-app montada no recibe sus propios eventos de arranque.

## Añadir un módulo
Con Claude Code:
```
/backend-new-module <nombre>    # entidad + DTO + service + router
/frontend-new-module <nombre>   # service + table + form + page
```
Otros skills: `/backend-init-project`, `/frontend-init-project`, `/frontend-sync-endpoints`, `/backend-db`.

Convenciones detalladas de capas, mapper, repositorio y patrón CRUD del frontend: ver [`CLAUDE.md`](CLAUDE.md).
