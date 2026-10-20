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
- Cambiar `sidebar-title` por el nombre corto del proyecto
- Agregar una entrada en `NAV_ITEMS` por cada módulo: `{ path: '/nombre', label: 'Nombre', icon: '📋' }`

### 7. Crear módulos iniciales
Por cada módulo indicado, ejecutar el flujo de `/frontend-new-module <nombre>`.

### 8. Limpiar archivos de ejemplo
- Eliminar `frontend/src/modules/example/`
- Remover el import de example en `frontend/src/index.ts`
- Remover la ruta de example en `frontend/src/app-root.ts`
