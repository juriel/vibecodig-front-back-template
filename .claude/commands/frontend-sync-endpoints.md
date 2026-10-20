# Skill: Sync Endpoints

Cuando el usuario invoque `/frontend-sync-endpoints`, obtener los endpoints del backend y actualizar la tabla en `CLAUDE.md` (raíz).

## Proceso

### 1. Leer la URL del backend
Leer `CLAUDE.md` (raíz) de este proyecto y usar el server local (puerto 8000 por defecto; el server debe estar corriendo).

### 2. Obtener el OpenAPI JSON
```bash
curl -s http://localhost:8000/api/openapi.json
```

### 3. Parsear y construir la tabla
Del JSON extraer `paths`: cada path tiene métodos HTTP como claves.
Para cada método obtener el `summary` o `description` del operationId.

Formato de la tabla:
```markdown
| Módulo | Método | Path | Descripción |
|--------|--------|------|-------------|
| tickets | GET | /tickets | ... |
```

El módulo se infiere del primer segmento del path (ej: `/tickets/{id}` → `tickets`).

### 4. Reemplazar la sección `## Endpoints consumidos` en `CLAUDE.md` (raíz)
Reemplazar todo el contenido entre `## Endpoints consumidos` y la siguiente sección `##` con la tabla nueva.

### 5. Confirmar
Mostrar cuántos endpoints se encontraron y qué módulos.
