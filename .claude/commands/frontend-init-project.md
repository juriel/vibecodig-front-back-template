# Skill: Init Project

Cuando el usuario invoque `/frontend-init-project`, configurar el proyecto desde el template.

## Proceso

### 1. Preguntar al usuario
- Nombre del proyecto
- URL del backend (apiUrl; por defecto `/api/`, mismo origen)
- Módulos iniciales a crear

### 2. Actualizar `CLAUDE.md` (raíz)
- Reemplazar `[NOMBRE DEL PROYECTO]`
- Completar `## Objetivo`
- Actualizar URL del backend en Stack
- Listar módulos en `## Módulos`

### 3. Actualizar `frontend/package.json`
- Cambiar `"name"` por el nombre real del proyecto

### 4. Actualizar `frontend/web/index.html`
- Cambiar `<title>` por el nombre real

### 5. Actualizar `frontend/src/global-config.ts`
- Poner la URL del backend como valor por defecto

### 6. Actualizar `frontend/src/app-root.ts`
- Cambiar `app.name` en ambos catálogos (`frontend/web/assets/i18n/*.properties`) por el nombre del proyecto
- Agregar una entrada en `MENU` de `frontend/src/menu.ts` por cada módulo: `{ label: 'menu.nombre', icon: 'dashboard', path: `${A}/nombre`, privileges: ['VIEW_NOMBRE'] }` (la clave `menu.nombre` va en ambos catálogos i18n)

### 7. Crear módulos iniciales
Por cada módulo indicado, ejecutar el flujo de `/frontend-new-module <nombre>`.

### 8. Limpiar archivos de ejemplo
- Eliminar `frontend/src/modules/example/`
- Remover del proyecto el módulo de ejemplo (`frontend/src/modules/example/`) y sus claves `example.*` de ambos catálogos i18n
- Remover la ruta de example en `frontend/src/app-root.ts`
