# [NOMBRE DEL PROYECTO]

## Objetivo
[Descripción breve del propósito del proyecto]

## Módulos
- [x] Login (usuarios, sesión en cookie, pantalla de inicio de sesión)
- [x] Panel estilo titi: encabezado con menús desplegables + inicio con tarjetas (secciones aún "en construcción")

## Stack
- Backend: Python + FastAPI, MySQL/MariaDB + SQLAlchemy (driver PyMySQL, `mysql+pymysql://`) (`backend/`)
- Frontend: Lit 3 (Web Components + TypeScript), @vaadin/router, Axios, Webpack 5 (`frontend/`)
- Servidor único: `server.py` (FastAPI) → API en `/api`, frontend compilado y estáticos en `/`
- Auth: sesión en cookie firmada (`SessionMiddleware`, `SECRET_KEY` en `.env`; `COOKIE_SECURE=1` en producción) + contraseñas bcrypt. Proteger rutas con `dependencies=[Depends(current_user)]` al incluir el router en `backend/main.py`
- Deploy: (Railway / Render / local)

## Cómo correr
```bash
# 1. Crear DB (solo la primera vez)
sudo mysql -e "CREATE DATABASE <db_name> CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER '<db_user>'@'localhost' IDENTIFIED BY '<db_pass>'; GRANT ALL ON <db_name>.* TO '<db_user>'@'localhost';"

# 2. Dependencias y configuración
cp .env.example .env            # editar con credenciales reales (DATABASE_URL, SECRET_KEY)
npm run install:all             # pip install -r requirements.txt + npm install en frontend/
python backend/create_user.py <login> "<Nombre>"   # primer usuario (pide la contraseña)

# 3a. Producción / simple: compila el frontend y levanta un solo server
npm start                       # http://localhost:8000 sitio público · /admin panel con login · /api/docs

# 3b. Desarrollo: dos terminales
npm run dev:front               # webpack --watch → frontend/web/dist/app.js
npm run dev:back                # uvicorn con reload
```
El navegador siempre habla con el mismo origen: `GlobalConfig.apiUrl = '/api/'`. No hay CORS ni segundo puerto.

## Estructura
```
server.py                  # entry point: monta backend en /api, /admin → SPA (index.html), / → sitio.html público
requirements.txt, .env.example, package.json (scripts raíz)
backend/
├── main.py                # define la sub-app `api` (FastAPI): sesión, routers + create_all (NO se ejecuta directo)
├── create_user.py         # crea usuarios desde la terminal
└── app/
    ├── db.py              # conexión, Base, get_db (lee ../.env de la raíz)
    ├── mapper.py          # mapper genérico DTO → entidad
    ├── repository.py      # BaseRepository, BaseService, Page
    ├── entities/          # entidades SQLAlchemy (registrar en __init__.py)
    ├── dtos/              # DTOs Pydantic (sufijo DTO)
    ├── routers/           # controladores delgados
    └── services/          # lógica de negocio
frontend/
├── package.json, webpack.config.js, tsconfig.json
├── src/
│   ├── index.ts, app-root.ts (login-page sin sesión; encabezado con desplegables y rutas /admin), global-config.ts, styles.css
│   ├── admin-menu.ts      # APP_NAME y MENU (grupos → secciones): de aquí salen el menú y las tarjetas del inicio
│   ├── icons.ts           # icon(nodo, tamaño): íconos de Lucide (`lucide`, versión fija) como <svg>
│   ├── auth/              # auth-service.ts (me/login/logout + 401 → login), login-page.ts
│   ├── crud/              # framework CRUD genérico — NO modificar
│   └── modules/<nombre>/  # service / table / form / page por módulo
└── web/
    ├── index.html         # panel (SPA) en /admin
    ├── sitio.html         # página pública provisional en /
    └── dist/app.js        # generado por webpack (ignorado por git), servido en /dist/app.js
```

## Reglas de integración
- Rutas del backend se declaran sin prefijo `/api` (lo añade el mount). Routers se incluyen en `backend/main.py` con `api.include_router(...)`.
- Los services del frontend usan `GlobalConfig.getInstance().apiUrl + '<recurso>'` (sin `/` inicial en `<recurso>`).
- El panel vive en `/admin`: cualquier ruta bajo `/admin` devuelve `index.html` (el router de Vaadin resuelve en cliente) y pide login. Las rutas del router y de `NAV_ITEMS` van con prefijo `/admin/`. `index.html` referencia `/dist/app.js` con ruta absoluta.
- El resto es el sitio público, sin login: `/` sirve `sitio.html`, los archivos de `web/` se sirven tal cual y cualquier otra ruta da 404.
- Tras cambiar código del frontend hay que recompilar (`npm run build` o `dev:front`); el server no compila.
- Ejecutar siempre desde la raíz con `server:app` (no `main:app`).

## Endpoints
| Método | Path (bajo /api) | Descripción |
|--------|------------------|-------------|
| POST | /auth/login | Inicia sesión `{login, password}` → usuario; 401 si no coincide |
| POST | /auth/logout | Cierra sesión |
| GET | /auth/me | Usuario de la sesión (401 sin sesión) |
| GET, POST | /examples | Ejemplo (requiere sesión) |
| GET, DELETE | /examples/{id} | Ejemplo (requiere sesión) |

## Convenciones backend

### Capas
- **Routers**: reciben el request, llaman al mapper, delegan al service. Sin lógica de negocio.
- **Services**: toda la lógica de negocio y acceso a DB. Reciben entidades o DTOs, nunca primitivos campo a campo.
- **Mapper**: convierte DTOs a entidades genéricamente. Los routers lo invocan antes de llamar al service.

### Entidades vs DTOs
- Entidades en `backend/app/entities/<nombre>.py`, heredan de `Base` (SQLAlchemy).
- DTOs en `backend/app/dtos/<nombre>_dto.py`, heredan de `BaseModel` (Pydantic), clase con sufijo `DTO`.
- Nunca mezclar ambos en el mismo archivo.
- Toda entidad nueva se registra en `backend/app/entities/__init__.py` para que `create_all` la detecte.

### Mapper genérico (`backend/app/mapper.py`)
Convierte un DTO en su entidad de forma recursiva (campos simples, objetos hijos, listas uno-a-muchos).

Registrar (en el router, una vez al cargar el módulo):
```python
mapper.register(ExampleCreateDTO, Example)
```
Usar en el router:
```python
@router.post("")
def create_item(body: ExampleCreateDTO, db: Session = Depends(get_db)):
    return example_service.create_item(db, mapper.dto_to_entity(body))
```
Para relaciones uno-a-muchos solo se registra el DTO raíz (el mapper infiere el hijo desde `relationship`). Campos del DTO sin equivalente en la entidad (ej. `password` → `password_hash`) se ignoran; el service hace la transformación y el router pasa el DTO directo.

### Rutas estáticas vs dinámicas
Declarar rutas estáticas (`/login`, `/buscar`) **antes** que dinámicas (`/{id}`) en el mismo router.

### BaseRepository
No duplicar lógica CRUD; usar `BaseRepository`. En listados usar `eager` (usa `selectinload`, evita N+1):
```python
EAGER = [Entidad.relacion1, Entidad.relacion2]
repo.find_all(eager=EAGER)
repo.find_all_by(eager=EAGER, campo="valor")
```

## Convenciones frontend

### Patrón CRUD — crear un módulo (`frontend/src/modules/<nombre>/`)
```typescript
// nombre.service.ts
export class NombreService extends CrudService<NombreDTO> {
  base = GlobalConfig.getInstance().apiUrl + 'nombre';
  getKey = (e: NombreDTO) => e.id!;
}

// nombre.table.ts
@customElement('nombre-table')
export class NombreTable extends CrudTable<NombreDTO> {
  get prefix() { return 'nombre'; }
  service = new NombreService();
  columns = () => [ { key: 'id', label: 'ID' }, { key: 'campo', label: 'Campo' } ];
}

// nombre.form.ts
@customElement('nombre-form')
export class NombreForm extends CrudForm<NombreDTO> {
  get prefix() { return 'nombre'; }
  service = new NombreService();
  fields = (): FormField[] => [
    { key: 'campo', label: 'Campo', required: true },
    { key: 'tipo', label: 'Tipo', type: 'select', options: { a: 'A', b: 'B' }, zone: 'left' },
    { key: 'notas', label: 'Notas', type: 'textarea', zone: 'bottom' },
  ];
}

// nombre.page.ts
@customElement('nombre-page')
export class NombrePage extends CrudPage<NombreDTO> {
  get prefix() { return 'nombre'; }
  label = 'Nombre';
  createTable = () => new NombreTable();
  createForm  = () => new NombreForm();
}
```
Registrar: importar en `frontend/src/index.ts` y añadir ruta en `frontend/src/app-root.ts` (antes de las de `pending-page`). Para que aparezca en el menú y en el inicio, agregar la sección en `MENU` de `admin-menu.ts` (`/admin/<nombre>`, etiqueta e ícono de Lucide); mientras no tenga componente propio, `app-root` la muestra con `pending-page`.

### FormField
| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| key | string | campo en el DTO |
| label | string | texto del label |
| type | text\|email\|number\|password\|textarea\|select\|checkbox | default: text |
| options | Record<string,string> | solo para select |
| required | boolean | valida en submit |
| disabled | boolean | no editable |
| zone | top\|left\|right\|bottom | posición en el layout, default: top |
| validator | (v) => boolean | validación custom |

## Skills (`.claude/commands/`)
- `/backend-init-project`, `/frontend-init-project` — completan nombre, config y limpian ejemplos
- `/backend-new-module <nombre>` — entidad + DTO + service + router + montaje en `backend/main.py`
- `/frontend-new-module <nombre>` — 4 archivos CRUD + registro en index y router
- `/frontend-sync-endpoints` — lee `/api/openapi.json` y actualiza la tabla de endpoints
- `/backend-db` — inspecciona la DB con el cliente mysql

## Mantenimiento
Al cerrar un objetivo considerable: actualizar **Módulos**, **Endpoints** y **Estructura** de este archivo.
