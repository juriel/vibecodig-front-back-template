# [NOMBRE DEL PROYECTO]

## Objetivo
[Descripción breve del propósito del proyecto]

## Módulos
- [x] Auth (login JWT + privilegios)
- [x] Panel `/admin`: menú lateral + inicio con tarjetas; secciones CMS aún "en construcción" (`pending-page`)
- [x] CMS público + administración de Pages (`/admin/pages`), Layouts (`/admin/layouts`), Widgets (`/admin/widgets`), CSS globales (`/admin/css`) y JS globales (`/admin/javascripts`); pendientes: Configuraciones globales, Carpetas y Archivos (media manager)
- [x] Perfiles (`/admin/profile`): CRUD de `profile` + asignación de privilegios agrupados por categoría; Privilegios (`/admin/privilege`): catálogo de solo lectura
- [x] Editor visual de páginas (GrapesJS 0.23.6, botón "Editar visualmente" en el formulario de páginas): edita el mismo HTML + CSS de la página viéndola con el CSS global del sitio; bloques que se agregan con clic o arrastrando, edición de texto en el lienzo, panel de configuración (enlace, imagen) y de estilo, subida de imágenes y PDF, vista computador/celular, deshacer
- [x] SEO del sitio público: meta description, canónica, Open Graph/Twitter y `noindex` por página (`cms_page_seo`), widget `head`, `/sitemap.xml`, `/robots.txt`, página 404 del CMS, redirecciones 301/302 (`/admin/redirects`, `cms_redirect`) y compresión gzip
- [x] Login (`login-page.ts`): título en dos líneas y un cursor que hace clic dejando una onda en los colores del usuario; se detiene con `prefers-reduced-motion`
- [x] Editor de código tipo VS Code (Monaco, `lib/code-editor.ts`) en todos los campos HTML/CSS/JS (`FormField.mono` + `language`), con sugerencias de IA que se aceptan con Tab
- [x] Asistente de IA (`backend/app/services/ai_service.py`, SDK oficial `anthropic`): «Crear con IA» en Páginas escribe un borrador oculto (noindex) con las clases, widgets y plantilla del sitio; sugerencias de código en línea. Se activa con `ANTHROPIC_API_KEY` en `.env`; sin clave el panel funciona y avisa
- [x] Mi cuenta (`/admin/account`, desde el menú del usuario): nombre y correo, tema claro/oscuro (guardado por usuario), idioma y cambio de contraseña
- [x] Inicio sin scroll (`modules/home/home-page.ts`, lista `QUICK`): saludo gigante condensado ("Hola, <nombre>") con una única animación de entrada; las 8 secciones de creación de TitiCMS (Páginas destacada en azul, el resto con ícono naranja); cuenta, usuarios, etc. quedan en los menús
- [x] Usuarios (`/admin/user`): CRUD sobre `users` con asignación de perfiles; borrado lógico (`deleted=1`)

## Stack
- Backend: Python + FastAPI, MariaDB/MySQL + SQLAlchemy (driver PyMySQL, `mysql+pymysql://`) (`backend/`)
- Frontend: Lit 3 (Web Components + TypeScript, light DOM), Tailwind CSS 4 (postcss-loader), @vaadin/router, Axios, Webpack 5 (`frontend/`)
- Servidor único: `server.py` (FastAPI) → API en `/api`, panel en `/admin`, sitio público en `/`
- Auth: JWT (PyJWT) sobre el esquema existente `users → user_x_profile → profile → profile_x_privilege → privilege`. Clave: `SHA-256(salt + password)` en hex. Privilegio `ALL` = todo; los permisos del usuario son la unión de los de todos sus perfiles. La base se usa tal cual: la app NO crea ni modifica esas tablas.
- Deploy: (Railway / Render / local)

## Cómo correr
```bash
# 1. Crear DB (solo la primera vez)
sudo mysql -e "CREATE DATABASE <db_name> CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER '<db_user>'@'localhost' IDENTIFIED BY '<db_pass>'; GRANT ALL ON <db_name>.* TO '<db_user>'@'localhost';"

# 2. Dependencias y configuración
cp .env.example .env            # editar con credenciales reales (DATABASE_URL, JWT_SECRET)
npm run install:all             # pip install -r requirements.txt + npm install en frontend/
python backend/create_user.py <login> "<Nombre>" [--profile ID]   # crea un usuario (pide la contraseña; perfil 1 = Administrator)

# 3a. Producción / simple: compila el frontend y levanta un solo server
npm start                       # http://localhost:8000 sitio público · /admin panel con login · /api/docs

# 3b. Desarrollo: dos terminales
npm run dev:front               # webpack --watch → frontend/web/dist/app.js
npm run dev:back                # uvicorn con reload
```
El navegador siempre habla con el mismo origen: `GlobalConfig.apiUrl = '/api/'`. No hay CORS ni segundo puerto.

## Estructura
```
server.py                  # entry point: monta backend en /api, /admin → SPA (index.html), / → sitio público del CMS
requirements.txt, .env.example, package.json (scripts raíz)
backend/
├── main.py                # define la sub-app `api` (FastAPI): routers + create_all (NO se ejecuta directo)
├── create_user.py         # crea usuarios desde la terminal (esquema users/user_x_profile)
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
│   ├── index.ts (carga el catálogo i18n y luego `boot.ts`), boot.ts (registra módulos e interceptores), app-root.ts (shell + rutas /admin + guard), global-config.ts (appName, adminBase, authRequired), menu.ts (menú lateral y tarjetas del inicio), styles.css (@theme Tailwind)
│   ├── shell/             # app-sidebar, app-header
│   ├── crud/              # framework CRUD genérico (tabla con búsqueda/paginación, form, page)
│   ├── lib/               # utilidades genéricas: ui (clases Tailwind), icons, i18n, validators, date, session (auth+interceptors), toast/confirmDialog, select-from-service, finder-search
│   └── modules/<nombre>/  # service / table / form / page por módulo
└── web/
    ├── index.html         # panel (SPA) en /admin
    ├── assets/i18n/       # catálogos en.properties / es.properties (frontend y backend)
    └── dist/app.js        # generado por webpack (ignorado por git), servido en /dist/app.js
```

## Reglas de integración
- Rutas del backend se declaran sin prefijo `/api` (lo añade el mount). Routers se incluyen en `backend/main.py` con `api.include_router(...)`.
- Los services del frontend usan `GlobalConfig.getInstance().apiUrl + '<recurso>'` (sin `/` inicial en `<recurso>`).
- El panel vive en `/admin`: cualquier ruta bajo `/admin` devuelve `index.html` (el router de Vaadin resuelve en cliente) y pide login (si `authRequired`). Las rutas del router y las de `menu.ts` van con prefijo `/admin` (`GlobalConfig.adminBase`); el login es `/admin/login`. `index.html` referencia `/dist/app.js` con ruta absoluta.
- El resto es el sitio público, sin login: `/` y `/<url>.page` los renderiza el CMS (sin página índice se muestra una página "en construcción" traducida), los archivos de `web/` se sirven tal cual y cualquier otra ruta da 404.
- Tras cambiar código del frontend hay que recompilar (`npm run build` o `dev:front`); el server no compila.
- Ejecutar siempre desde la raíz con `server:app` (no `main:app`).

## Endpoints
| Método | Path (bajo /api) | Descripción |
|--------|------------------|-------------|
| POST | /auth/login | `{login, password}` → `{token, user, privileges[], preferences}` (401 si credenciales inválidas) |
| GET | /auth/me | usuario, privilegios y `preferences` ({theme}) del token actual |
| PUT | /auth/me | `{name, email?}`: el usuario actual edita sus datos (Mi cuenta) |
| PUT | /auth/me/password | `{current_password, new_password}` (mín. 6): 400 si la actual no coincide; nueva salt + SHA-256 como el resto |
| PUT | /auth/me/preferences | actualización parcial `{theme?: light\|dark, palette?, brand?: #rrggbb, accent?: #rrggbb}` del usuario actual |
| GET | /users | lista usuarios no borrados con sus perfiles (`VIEW_USER`) |
| GET | /users/profiles | perfiles asignables por el usuario actual (`VIEW_USER`/`ADD_USER`/`EDIT_USER`) |
| GET | /users/{login} | detalle (`VIEW_USER`) |
| POST | /users | crea `{login, password, name, email?, profile_ids[]}` (`ADD_USER`); 409 si el login existe |
| PUT | /users/{login} | edita `{name, email?, password?, profile_ids[]}`; password vacío = sin cambio (`EDIT_USER`) |
| DELETE | /users/{login} | borrado lógico (`DELETE_USER`); no permite borrarse a sí mismo |
| GET | /cms/pages/layouts | plantillas para el selector del formulario de página (`ADD_CMS_PAGE`/`EDIT_CMS_PAGE`) |
| GET, POST | /cms/pages | lista (sin contenido pesado) / crea; el dueño es el usuario actual (`VIEW_`/`ADD_CMS_PAGE`) |
| GET, PUT, DELETE | /cms/pages/{id} | detalle completo / edita / elimina (`VIEW_`/`EDIT_`/`DELETE_CMS_PAGE`) |
| GET | /cms/pages/editor-assets | hojas de estilo globales activas que el editor visual carga en su lienzo (`ADD_CMS_PAGE`/`EDIT_CMS_PAGE`) |
| GET, POST | /cms/media | archivos subidos (`VIEW_FOLDER`/`ADD_FOLDER`) / sube uno (multipart, campo `file`; `ADD_FOLDER`): imágenes PNG/JPG/GIF/WEBP/SVG → carpeta `imagenes`, PDF → `documentos`; máx. 15 MB; responde `{id, name, src: /media/<carpeta>/<archivo>, type}` |
| GET | /cms/layouts/types | tipos de plantilla (`ADD_CMS_LAYOUT`/`EDIT_CMS_LAYOUT`) |
| GET, POST | /cms/layouts | plantillas (`VIEW_`/`ADD_CMS_LAYOUT`) |
| GET, PUT, DELETE | /cms/layouts/{id} | detalle / edita / elimina; 409 si la usa alguna página (`VIEW_`/`EDIT_`/`DELETE_CMS_LAYOUT`) |
| GET, POST | /cms/widgets | widgets con conteo de usos (privilegios de páginas: `VIEW_`/`ADD_CMS_PAGE`) |
| GET, PUT, DELETE | /cms/widgets/{id} | detalle / edita / elimina; 409 al renombrar o borrar si está en uso (`VIEW_`/`EDIT_`/`DELETE_CMS_PAGE`) |
| GET, POST | /cms/redirects | redirecciones / crea `{source, target, status_code: 301\|302, active}` (privilegios de páginas: `VIEW_`/`ADD_CMS_PAGE`) |
| GET, PUT, DELETE | /cms/redirects/{id} | detalle / edita / elimina (`VIEW_`/`EDIT_`/`DELETE_CMS_PAGE`) |
| GET, POST | /cms/css, /cms/js | recursos globales (sin contenido pesado, con `content_length` y `source`: `external`/`own`) / crea (`VIEW_`/`ADD_CMS_LAYOUT`) |
| GET, PUT, DELETE | /cms/css/{code}, /cms/js/{code} | detalle con `content` / edita (el `code` es inmutable) / elimina (`VIEW_`/`EDIT_`/`DELETE_CMS_LAYOUT`) |
| GET | /ai/status | `{enabled, draft_model, complete_model}` (cualquier usuario con sesión) |
| POST | /ai/draft-page | `{brief, cms_layout?}` → crea un borrador de página oculto con IA y lo devuelve (`ADD_CMS_PAGE`); 503 si la IA no está configurada |
| POST | /ai/complete | `{language: html\|css\|javascript, before, after}` → `{text}` sugerencia para insertar en el cursor (privilegios de páginas o plantillas) |
| GET | /privileges | catálogo completo de privilegios, solo lectura (`VIEW_PROFILE`) |
| GET | /profiles/privileges | privilegios que el usuario actual puede conceder (`ADD_PROFILE`/`EDIT_PROFILE`) |
| GET | /profiles | lista perfiles con `privilege_codes[]` (`VIEW_PROFILE`) |
| GET | /profiles/{id} | detalle (`VIEW_PROFILE`) |
| POST | /profiles | crea `{name, privilege_codes[]}` (`ADD_PROFILE`); 409 si el nombre existe |
| PUT | /profiles/{id} | edita `{name, privilege_codes[]}` (`EDIT_PROFILE`) |
| DELETE | /profiles/{id} | elimina (`DELETE_PROFILE`); 409 si lo usa algún usuario activo |

## Idioma del código e i18n
- **Todo el código en inglés**: identificadores, comentarios, docstrings, rutas del router y de la API, URLs, nombres de claves, mensajes de commit. Solo el **contenido** (textos para el usuario, datos de la base) puede estar en otro idioma.
- **Todo texto visible pasa por i18n.** Idioma por defecto y fallback: `en`; también `es`. Un único catálogo compartido: `frontend/web/assets/i18n/<lang>.properties` (`clave=valor`, marcadores `{0}`, `{1}`; plurales con sufijos `.one`/`.other` y `I18n.tn`).
- Frontend: `I18n.t('clave', ...args)` (`lib/i18n.ts`); las etiquetas de `menu.ts` son claves `menu.*`. El idioma sale de localStorage > navegador > `en`; el selector (`<lang-switch>`) guarda la elección y recarga la página. Cada petición envía `Accept-Language`.
- Backend: no escribir mensajes literales. Lanzar `ApiError(status, 'error.<modulo>.<causa>', *args)` (`app/errors.py`); el servidor lo traduce con `Accept-Language` y responde `{"detail": <mensaje>, "code": <clave>}`. Las páginas públicas (404, "en construcción") y la CLI (`create_user.py`, según `LANG`) usan `t()` de `app/i18n.py`. Errores 422 de Pydantic: el formulario los traduce por tipo (`validation.<type>`) y los muestra en cada campo.
- Idioma del sitio publicado: `SITE_LANG` (`.env`) fija el `<html lang>`; es independiente del idioma del panel y el contenido de la base no se traduce.
- Al añadir o cambiar textos: editar **ambos** catálogos y ejecutar `python3 scripts/check_i18n.py` (falla si falta una clave en algún idioma o si el código usa una clave inexistente).

## Convenciones backend

### Auth y privilegios
- Variables `.env`: `JWT_SECRET` (obligatoria), `JWT_EXPIRE_MINUTES` (default 480).
- `app/security.py`: `get_current_user` (exige `Authorization: Bearer`) y `require_privilege('VIEW_X', ...)` (al menos uno, o `ALL`). Proteger routers con `dependencies=[Depends(...)]`.
- Privilegios con patrón `ACCION_ENTIDAD`: `ADD_`, `EDIT_`, `DELETE_`, `VIEW_`. El frontend los deriva con `SessionStatus.allowed('user','edit')` → `EDIT_USER` (create→ADD, list/view→VIEW).
- Sitio público del CMS (fuera de `/api`, `backend/app/routers/cms_public.py`, incluido en `server.py` antes del fallback):
  `GET /` y `GET /<url>.page` renderizan la página (`/` = la de `is_index=1`; sin ninguna se muestra la página provisional), `GET /css/<path>` y `/js/<path>` sirven CSS/JS globales (`cms_css.path`/`cms_js.path`) o los de una página (`<url>.css`, `<url>.js`), `GET /media/<carpeta>/<archivo>` sirve el archivo desde el VFS (`?download=true` fuerza descarga).
  Marcadores de plantilla: `%CONTENT%`, `%TITLE%`, `%SUBTITLE%`, `%OWNER%`, `%URL%`, `%ID%`, `%CREATION_DATE%`, `%UPDATE_DATE%` y `%WIDGET:name%` (también dentro del contenido de la página; los widgets no se expanden entre sí). Un widget inexistente deja un comentario HTML.
  CSS activos (`active=1`, por `order_show`; `url` externa o `/css/<path>`) van en todas las páginas; JS por `type` (`header` en el `<head>`, `footer` al final del `<body>`).
  Las páginas privadas (con filas en `page_x_registered_user_group`) responden 403 y no exponen su CSS/JS: el login de usuarios registrados no está portado.
  El media manager lee `vfs.path` relativo a `VFS_PATH` (`.env`, default `/opt/vfs`) y nunca sale de esa raíz; los SVG/HTML servidos llevan `Content-Security-Policy: sandbox`.
- Reglas de CMS (admin): URL de página única y con patrón `[A-Za-z0-9][A-Za-z0-9_-/]*`; solo una página índice; el dueño y la fecha de creación no cambian al editar. Una sola plantilla predeterminada por tipo (la primera de un tipo lo es siempre; al borrar la predeterminada se promueve otra). No se borra una plantilla en uso. Los widgets se nombran con `[A-Za-z0-9_-]`, y no se renombran ni borran si alguna plantilla o página los referencia. Los widgets no tienen privilegios propios: usan los de páginas.
- SEO (`app/services/cms_seo_service.py`): los campos SEO de una página (`description`, `og_title`, `og_description`, `og_image`, `canonical`, `noindex`) viajan en el mismo DTO de páginas pero se guardan en `cms_page_seo` (1:1; `cms_page` queda como en el CMS original). En el `<head>` salen description, canónica (vacía = URL propia; la página índice siempre es `/`), Open Graph y Twitter Card (título/descripción al compartir caen al título/description), `og:site_name`/`og:locale` y, al final, el widget llamado `head` (favicon, verificaciones, geo). `noindex` → `<meta name="robots" content="noindex, follow">`, sin canónica y fuera del sitemap.
  Ajustes del sitio en `global_configuration` (tabla del CMS original, aún sin pantalla): `seo.site_url` (dominio público para canónicas, OG, sitemap y robots; vacío = el host del request), `seo.site_name`, `seo.locale` (p. ej. `es_CO`).
  `GET /sitemap.xml`: páginas no privadas, sin `noindex`, sin canónica ajena y distintas de la 404. `GET /robots.txt`: bloquea `/admin` y `/api/` y apunta al sitemap.
  Rutas desconocidas (y `/<url>.page` inexistentes): primero una redirección activa de `cms_redirect` (se revisa antes que los archivos de `web/`, así `/index.html` también se puede redirigir); si no, la página del CMS con URL `404` (con estado 404 y `noindex`); si no existe, la 404 simple. Las redirecciones no pueden salir de rutas propias del sitio (`/admin`, `/api/`, `/css/`, `/js/`, `/media/`, `/dist/`, `*.page`, sitemap, robots). `GZipMiddleware` comprime respuestas de más de 1 KB.
- Reglas de CSS/JS globales (`cms_css`, `cms_js`; sin privilegios propios: usan los de plantillas, `*_CMS_LAYOUT`): un recurso es EXTERNO (`url` http/https, sin path ni contenido; se guardan vacíos) o PROPIO (`path` relativo terminado en `.css`/`.js` + `content`, servido en `/css/<path>` o `/js/<path>`), nunca ambos. El `path` es único y no puede tapar el CSS/JS propio de una página (`/css/<url>.css`); a la inversa, una página con CSS/JS propio no puede usar una URL cuyo path ya sirve un global. `code` (PK, `[A-Za-z0-9_-]`, máx. 32) no cambia tras crear. Solo los `active` se incluyen en el sitio, por `order_show`; los JS llevan `type` `header` (en el `<head>`) o `footer`. `/css/*` y `/js/*` se sirven con `ETag` y `Cache-Control: public, no-cache` (revalidan siempre: una edición se ve al instante; `If-None-Match` → 304).
- Reglas de perfiles: los perfiles con `editable=0` (sistema, p. ej. Administrator) no se modifican ni borran. Solo se pueden CONCEDER privilegios que el actor posee (`ALL` puede todo). Un perfil con `ALL` solo lo administra un super usuario. No se borra un perfil en uso; la tabla no tiene claves foráneas, así que la integridad la garantiza la app. El catálogo de privilegios es de solo lectura (los códigos los define el código de la plataforma).
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
- Temas claro (por defecto) y oscuro (`styles.css`): `@theme` define el claro y `:root[data-theme="dark"]` redefine las mismas variables. Superficies `bg-ink` (página), `bg-surface` (tarjetas), `bg-raised` (campos/hover). En oscuro la escala `slate` y `brand` se invierten (50 = oscuro, 900 = claro), así cada clase conserva su sentido (`text-slate-900` = texto más fuerte, `border-slate-200` = línea). No usar `bg-white`: usar `bg-surface`.
- Colores del panel por usuario: `src/palettes/palette.css` deriva las escalas `brand` (principal) y `accent` (acento) de dos colores base (`--brand-base`, `--accent-base`; por defecto los de TitiCMS) para claro y oscuro. Cada usuario elige en Mi cuenta un estilo predefinido (`lib/palettes.ts`: titi = «Clásico», nexvia, ocean, forest, grape, ruby, slate) o sus dos colores ("custom"); se guarda en `user_preference` (palette, brand, accent) y `lib/theme.ts` lo aplica: calcula el texto blanco u oscuro sobre cada color (`--color-on-primary`, `--color-on-accent`) y una versión legible como texto (`--brand-ink`, `--accent-ink`, contraste ≥ 4.5). Para añadir un estilo: agregarlo en `lib/palettes.ts` y su nombre `palette.<id>` en los catálogos.
- Pantallas al estilo TitiCMS (`lib/title-band.ts`): franja azul con ícono, título y acciones ("Nuevo" en naranja); tablas con encabezado naranja, filas alternadas, acciones de color (ver en el color principal, editar verde, eliminar rojo) y paginación clásica con movimiento (flechas en círculo, números con «…»; el círculo activo se desliza a la página elegida y una línea de progreso muestra el avance; las filas entran con una transición corta). Movimiento desactivado con `prefers-reduced-motion`.. Formularios a todo el ancho.
- Colores de TitiCMS, cada uno por separado (sin degradados que los mezclen): `brand` = azul titi para botones, enlaces, íconos y títulos; `accent` = naranja titi para la marca, la opción activa del menú (fondo y texto), los íconos de accesos rápidos, la línea bajo los títulos de pantalla, el avatar y el botón "Editar visualmente". El oscuro sigue la paleta de GitHub (#0d1117 / #161b22 / #30363d, texto #e6edf3) para que se lea bien.
- El tema es de cada usuario: tabla `user_preference` (login, theme, palette, brand, accent; columnas nuevas se agregan al arrancar en `backend/main.py` `_add_missing_columns`), viaja en `preferences` del login y de `/auth/me`, se cambia en Mi cuenta (`PUT /auth/me/preferences`). `lib/theme.ts` lo aplica; `localStorage` solo recuerda el último del equipo para que `index.html` lo pinte sin parpadeo.
- Tipografía: Onest (interfaz) y Barlow Condensed (`font-display`, solo títulos de pantalla en mayúsculas). Botones píldora.
- Todos los componentes son light DOM (`createRenderRoot() { return this; }`) para que apliquen las utilidades de Tailwind. No usar `static styles`/shadow DOM.
- Colores y fuente se cambian en el bloque `@theme` de `styles.css` (escala `brand-*` y `sidebar*`); usar `bg-brand-600`, no colores fijos.
- Reutilizar `ui`/`btn()` de `lib/ui.ts` e `icon()` de `lib/icons.ts` en lugar de repetir clases.
- Menú lateral: `src/menu.ts` (`label` = clave i18n, rutas en inglés, `privileges`); rutas: `app-root.ts`. Auth: poner `authRequired = true` en `global-config.ts` cuando exista `POST /api/auth/login` (devuelve `{token, user, privileges[]}`).

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
  columns = () => [ { key: 'id', label: 'ID' }, { key: 'campo', label: I18n.t('nombre.field.campo') } ];
}

// nombre.form.ts
@customElement('nombre-form')
export class NombreForm extends CrudForm<NombreDTO> {
  get prefix() { return 'nombre'; }
  service = new NombreService();
  fields = (): FormField[] => [
    { key: 'campo', label: I18n.t('nombre.field.campo'), required: true },
    { key: 'tipo', label: I18n.t('nombre.field.tipo'), type: 'select', options: { a: 'A', b: 'B' }, zone: 'left' },
    { key: 'notas', label: I18n.t('nombre.field.notas'), type: 'textarea', zone: 'bottom' },
  ];
}

// nombre.page.ts
@customElement('nombre-page')
export class NombrePage extends CrudPage<NombreDTO> {
  get prefix() { return 'nombre'; }
  label = I18n.t('menu.nombre');
  createTable = () => new NombreTable();
  createForm  = () => new NombreForm();
}
```
Registrar: importar en `frontend/src/boot.ts` y añadir ruta `/admin/<nombre>` en `frontend/src/app-root.ts` (antes de las secciones pendientes). Para que aparezca en el menú y en las tarjetas del inicio, agregar la entrada en `MENU` de `frontend/src/menu.ts` (ruta `/admin/<nombre>`, icono de `lib/icons.ts` y `privileges`); si aún no tiene componente propio, márcala `pending: true` y `app-root` la muestra con `pending-page` (quitar `pending` al registrar su ruta).

### Editor visual de páginas (`modules/cms-page/page-visual-editor.ts`)
- GrapesJS se carga bajo demanda (`import()` → chunk aparte, ~1,1 MB): el panel no lo descarga hasta pulsar "Editar visualmente".
- Recibe el HTML y el CSS que el formulario tiene en ese momento y, al "Aplicar cambios", los devuelve a los mismos campos (`page_content`, `css`); se publican con el "Guardar" del formulario. La página sigue guardándose como HTML + CSS.
- `allowScripts` y `allowUnsafeAttr` activos: conserva JSON-LD y `onclick="..."` del contenido. `componentFirst`: los estilos van al elemento seleccionado (regla `#id` en el CSS de la página), nunca a una clase compartida; las etiquetas de clases están ocultas.
- En el lienzo (solo ahí) se muestran visibles los elementos que el sitio revela al hacer scroll (`.animate-on-scroll`, `.fade-in`, `.reveal`, `[data-aos]`).
- Panel "Ajustes rápidos" (`quick-style-panel.ts`) para el elemento seleccionado: colores de texto y fondo (muestras = variables CSS de `:root` del sitio + selector libre), tamaño (A−/A+ y predefinidos), tipo de letra, formato, alineación, esquinas, sombra, espacio interior, estilo de botón (`btn-primary`/`btn-outline`), ancho y centrado de imagen, y "Quitar mis cambios". Usa `StyleManager.addStyleTargets`, así en vista Celular el cambio va a un `@media` y no afecta al computador. El Style Manager completo queda en "Más opciones (avanzado)".
- `server.py` envía `Cache-Control: no-cache` en `/dist/*`, `/assets/i18n/*` y `/admin*` (el bundle no lleva hash: sin esto el navegador seguía usando el panel viejo tras actualizar).
- Bloques: clic = se insertan después del elemento seleccionado (o al final) vía `appendOnClick`; también se arrastran. Imagen abre el selector (subir o elegir); Documento PDF pide el archivo y enlaza a él. Al seleccionar una imagen o un enlace aparece "Configuración" (traits: lleva a, abrir en, descripción) con "Cambiar imagen" / "Enlazar a un PDF".
- Subidas (`app/services/cms_media_service.py`): nombre limpio (sin tildes ni espacios) y único por carpeta (`-2`, `-3`...), guardado en el VFS como el CMS original (`VFS_PATH/cms/aa/bb/cc/dd/<uuid>`, filas en `vfs` y `cms_mediamanager_file`). Requiere `python-multipart`.
- Bloques propios en `blocks()` (usan clases del sitio como `container`, `btn btn-primary`); textos en `visual.*` del catálogo i18n.

### Extensiones de `crud/`
- `CrudTable`: sobrescribir `canEditRow(item)` / `canDeleteRow(item)` para ocultar acciones por fila.
- `CrudTable`/`CrudPage`: `get permission()` (default `prefix`) fija el prefijo de los privilegios si el módulo comparte los de otro (ej. widgets usan `cms-page`).
- `CrudPage`: `canCreate = false` oculta el botón "Nuevo" (listados de solo lectura).
- `CrudForm`: `load(element)` / `reset()`; `repopulate()` tras cargar opciones asíncronas.

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
| default | string / number / boolean | valor inicial al crear (checkbox: marcado) |
| rows / mono / placeholder / help | number / boolean / string / string | `textarea`: filas y fuente monoespaciada (HTML/CSS/JS); `placeholder` y texto de `help` bajo el campo (cualquier tipo) |
| groups | Record<string,Record<string,string>> | solo `checkboxes`: opciones agrupadas por categoría `{ grupo: { value: label } }` (con botón "Todos / ninguno") |
| validator | (v) => boolean | validación custom |

## Diseño del panel
Skill del proyecto **`comtor-moderno`** (`.claude/skills/comtor-moderno/`): identidad, tokens, componentes, reglas de diseño del usuario y verificación. Úsala para cualquier cambio visual del panel.

## Pruebas de navegador
`scripts/e2e/run.sh` (ver `scripts/e2e/README.md`): con un servidor de pruebas en `:8001`, prueba login, inicio, Mi cuenta, colores, paginación, editor visual, subidas, ajustes rápidos y páginas de ejemplo; usa administradores temporales `zz_test_*` y limpia al terminar.

## Skills (`.claude/commands/`)
- `/backend-init-project`, `/frontend-init-project` — completan nombre, config y limpian ejemplos
- `/backend-new-module <nombre>` — entidad + DTO + service + router + montaje en `backend/main.py`
- `/frontend-new-module <nombre>` — 4 archivos CRUD + registro en index y router
- `/frontend-sync-endpoints` — lee `/api/openapi.json` y actualiza la tabla de endpoints
- `/backend-db` — inspecciona la DB con el cliente `mysql`

## Mantenimiento
Al cerrar un objetivo considerable: actualizar **Módulos**, **Endpoints** y **Estructura** de este archivo.
