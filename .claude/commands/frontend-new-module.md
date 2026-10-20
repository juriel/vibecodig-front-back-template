# Skill: New Module

Cuando el usuario invoque `/frontend-new-module <nombre>`, generar los 4 archivos CRUD para ese módulo.

Reemplazar `<Nombre>` con PascalCase y `<nombre>` con kebab-case del módulo.

**Idioma e i18n:** todo el código, los nombres de archivos, las clases y las **rutas van en inglés** (`/admin/<nombre>`). Ningún texto visible va escrito a mano: cada `label`, título de columna, ayuda, etc. usa `I18n.t('<nombre>.field.<campo>')` (importar `I18n` de `lib/i18n`) y las claves se agregan a **ambos** catálogos (`frontend/web/assets/i18n/en.properties` y `es.properties`), incluida la del menú (`menu.<nombre>`). Al terminar, ejecutar `python3 scripts/check_i18n.py`.

## 1. `frontend/src/modules/<nombre>/<nombre>.service.ts`

```typescript
import { CrudService } from '../../crud/crud-service';
import { GlobalConfig } from '../../global-config';

export interface <Nombre>DTO {
  id?: number;
  // agregar campos según el modelo del backend
}

export class <Nombre>Service extends CrudService<<Nombre>DTO> {
  base = GlobalConfig.getInstance().apiUrl + '<nombre>';
  getKey = (e: <Nombre>DTO) => e.id!;
}
```

## 2. `frontend/src/modules/<nombre>/<nombre>.table.ts`

```typescript
import { customElement } from 'lit/decorators.js';
import { CrudTable } from '../../crud/crud-table';
import { <Nombre>Service, <Nombre>DTO } from './<nombre>.service';

@customElement('<nombre>-table')
export class <Nombre>Table extends CrudTable<<Nombre>DTO> {
  get prefix() { return '<nombre>'; }
  service = new <Nombre>Service();
  columns = () => [
    { key: 'id', label: 'ID' },
    // { key: 'campo', label: I18n.t('<nombre>.field.campo') },
    // agregar columnas según los campos del DTO
  ];
}
```

## 3. `frontend/src/modules/<nombre>/<nombre>.form.ts`

```typescript
import { customElement } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { <Nombre>Service, <Nombre>DTO } from './<nombre>.service';

@customElement('<nombre>-form')
export class <Nombre>Form extends CrudForm<<Nombre>DTO> {
  get prefix() { return '<nombre>'; }
  service = new <Nombre>Service();
  fields = (): FormField[] => [
    // add fields: { key, label: I18n.t('<nombre>.field.<campo>'), type?, required?, zone?, options? }
  ];
}
```

## 4. `frontend/src/modules/<nombre>/<nombre>.page.ts`

```typescript
import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { <Nombre>Table } from './<nombre>.table';
import { <Nombre>Form } from './<nombre>.form';
import { <Nombre>DTO } from './<nombre>.service';

@customElement('<nombre>-page')
export class <Nombre>Page extends CrudPage<<Nombre>DTO> {
  get prefix() { return '<nombre>'; }
  label  = I18n.t('menu.<nombre>');
  createTable = () => new <Nombre>Table();
  createForm  = () => new <Nombre>Form();
}
```

## 5. Registrar en `frontend/src/boot.ts`
Agregar:
```typescript
import './modules/<nombre>/<nombre>.page';
import './modules/<nombre>/<nombre>.table';
import './modules/<nombre>/<nombre>.form';
```

## 6. Agregar ruta en `frontend/src/app-root.ts`
```typescript
{ path: `${ADMIN}/<nombre>`, component: '<nombre>-page' }
```
Y agregar la entrada en `frontend/src/menu.ts` (`label: 'menu.<nombre>'`, `path: `${A}/<nombre>``, `icon`, `privileges: ['VIEW_<NOMBRE>']`).

## 7. Actualizar CLAUDE.md
- Marcar módulo como ✅ en `## Módulos`
- Agregar endpoints a la tabla

## Nota
Completar el DTO, las columnas y los fields con los campos reales del backend antes de usar.
Ver tabla **FormField — opciones** en CLAUDE.md para referencia de los campos disponibles.
