# [NOMBRE DEL PROYECTO]

## Objetivo
[Descripción breve del propósito del proyecto]

## Módulos
- [x] Auth (login JWT + privilegios)
- [x] Usuarios (`/user`): CRUD sobre `users` con asignación de perfiles; borrado lógico (`deleted=1`)
- [ ] Módulo 1

## Stack
- Backend: Python + FastAPI, MariaDB/MySQL + SQLAlchemy (PyMySQL) (`backend/`)
- Frontend: Lit 3 (Web Components + TypeScript, light DOM), Tailwind CSS 4 (postcss-loader), @vaadin/router, Axios, Webpack 5 (`frontend/`)
- Servidor único: `server.py` (FastAPI) → API en `/api`, frontend compilado y estáticos en `/`
- Auth: JWT (PyJWT) sobre el esquema existente `users → user_x_profile → profile → profile_x_privilege → privilege`. Clave: `SHA-256(salt + password)` en hex. Privilegio `ALL` = todo; los permisos del usuario son la unión de los de todos sus perfiles. La base se usa tal cual: la app NO crea ni modifica esas tablas.
- Deploy: (Railway / Render / local)

## Cómo correr
```bash
# 1. Crear DB (solo la primera vez)
mysql -u root -p -e "CREATE DATABASE <db_name> CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER '<db_user>'@'localhost' IDENTIFIED BY '<db_pass>'; GRANT ALL PRIVILEGES ON <db_name>.* TO '<db_user>'@'localhost'; FLUSH PRIVILEGES;"

# 2. Dependencias y configuración
cp .env.example .env            # editar con credenciales reales
npm run install:all             # pip install -r requirements.txt + npm install en frontend/

# 3a. Producción / simple: compila el frontend y levanta un solo server
npm start                       # http://localhost:8000  (API en /api, docs en /api/docs)

# 3b. Desarrollo: dos terminales
npm run dev:front               # webpack --watch → frontend/web/dist/app.js
npm run dev:back                # uvicorn con reload
```
El navegador siempre habla con el mismo origen: `GlobalConfig.apiUrl = '/api/'`. No hay CORS ni segundo puerto.

## Estructura
```
server.py                  # entry point: monta backend en /api, sirve frontend/web + fallback SPA
requirements.txt, .env.example, package.json (scripts raíz)
backend/
├── main.py                # define la sub-app `api` (FastAPI): routers + create_all (NO se ejecuta directo)
└── app/
    ├── db.py              # conexión, Base, get_db (lee ../.env de la raíz)
    ├── security.py        # JWT, hash de clave, get_current_user, require_privilege
    ├── mapper.py          # mapper genérico DTO → entidad
    ├── repository.py      # BaseRepository, BaseService, Page
    ├── entities/          # entidades SQLAlchemy (registrar en __init__.py)
    ├── dtos/              # DTOs Pydantic (sufijo DTO)
    ├── routers/           # controladores delgados
    └── services/          # lógica de negocio
frontend/
├── package.json, webpack.config.js, tsconfig.json
├── src/
│   ├── index.ts, app-root.ts (shell + rutas + guard), global-config.ts (appName, authRequired), menu.ts (menú lateral), styles.css (@theme Tailwind)
│   ├── shell/             # app-sidebar, app-header
│   ├── crud/              # framework CRUD genérico (tabla con búsqueda/paginación, form, page)
│   ├── lib/               # utilidades genéricas: ui (clases Tailwind), icons, i18n, validators, date, session (auth+interceptors), toast/confirmDialog, select-from-service, finder-search
│   └── modules/<nombre>/  # service / table / form / page por módulo
└── web/
    ├── index.html
    └── dist/app.js        # generado por webpack (ignorado por git), servido en /dist/app.js
```

## Reglas de integración
- Rutas del backend se declaran sin prefijo `/api` (lo añade el mount). Routers se incluyen en `backend/main.py` con `api.include_router(...)`.
- Los services del frontend usan `GlobalConfig.getInstance().apiUrl + '<recurso>'` (sin `/` inicial en `<recurso>`).
- Cualquier ruta que no sea `/api/*` ni un archivo existente devuelve `index.html` (el router de Vaadin resuelve en cliente). Por eso `index.html` referencia `/dist/app.js` con ruta absoluta.
- Tras cambiar código del frontend hay que recompilar (`npm run build` o `dev:front`); el server no compila.
- Ejecutar siempre desde la raíz con `server:app` (no `main:app`).

## Endpoints
| Método | Path (bajo /api) | Descripción |
|--------|------------------|-------------|
| POST | /auth/login | `{login, password}` → `{token, user, privileges[]}` (401 si credenciales inválidas) |
| GET | /auth/me | usuario y privilegios del token actual |
| GET | /users | lista usuarios no borrados con sus perfiles (`VIEW_USER`) |
| GET | /users/profiles | perfiles asignables por el usuario actual (`VIEW_USER`/`ADD_USER`/`EDIT_USER`) |
| GET | /users/{login} | detalle (`VIEW_USER`) |
| POST | /users | crea `{login, password, name, email?, profile_ids[]}` (`ADD_USER`); 409 si el login existe |
| PUT | /users/{login} | edita `{name, email?, password?, profile_ids[]}`; password vacío = sin cambio (`EDIT_USER`) |
| DELETE | /users/{login} | borrado lógico (`DELETE_USER`); no permite borrarse a sí mismo |

## Convenciones backend

### Auth y privilegios
- Variables `.env`: `JWT_SECRET` (obligatoria), `JWT_EXPIRE_MINUTES` (default 480).
- `app/security.py`: `get_current_user` (exige `Authorization: Bearer`) y `require_privilege('VIEW_X', ...)` (al menos uno, o `ALL`). Proteger routers con `dependencies=[Depends(...)]`.
- Privilegios con patrón `ACCION_ENTIDAD`: `ADD_`, `EDIT_`, `DELETE_`, `VIEW_`. El frontend los deriva con `SessionStatus.allowed('user','edit')` → `EDIT_USER` (create→ADD, list/view→VIEW).
- Reglas de usuarios: solo un super usuario (`ALL`) puede asignar perfiles con `ALL` o modificar/borrar a otro super usuario. Usuarios borrados (`deleted=1`) no pueden iniciar sesión ni reutilizar su login. El login responde el mismo 401 para usuario inexistente o clave errónea.

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

### Diseño (Tailwind)
- Todos los componentes son light DOM (`createRenderRoot() { return this; }`) para que apliquen las utilidades de Tailwind. No usar `static styles`/shadow DOM.
- Colores y fuente se cambian en el bloque `@theme` de `styles.css` (escala `brand-*` y `sidebar*`); usar `bg-brand-600`, no colores fijos.
- Reutilizar `ui`/`btn()` de `lib/ui.ts` e `icon()` de `lib/icons.ts` en lugar de repetir clases.
- Menú lateral: `src/menu.ts` (con `privileges`); rutas: `app-root.ts`. Auth: poner `authRequired = true` en `global-config.ts` cuando exista `POST /api/auth/login` (devuelve `{token, user, privileges[]}`).

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
Registrar: importar en `frontend/src/index.ts` y añadir ruta en `frontend/src/app-root.ts`.

### FormField
| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| key | string | campo en el DTO |
| label | string | texto del label |
| type | text\|email\|number\|password\|textarea\|select\|checkbox\|checkboxes | default: text |
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
- `/backend-db` — inspecciona la DB con el cliente `mysql`

## Mantenimiento
Al cerrar un objetivo considerable: actualizar **Módulos**, **Endpoints** y **Estructura** de este archivo.
