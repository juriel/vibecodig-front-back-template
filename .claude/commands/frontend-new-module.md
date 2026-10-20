# Skill: New Module

Cuando el usuario invoque `/frontend-new-module <nombre>`, generar los 4 archivos CRUD para ese módulo.

Reemplazar `<Nombre>` con PascalCase y `<nombre>` con kebab-case del módulo.

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
    // agregar campos: { key, label, type?, required?, zone?, options? }
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
  label  = '<Nombre>';
  createTable = () => new <Nombre>Table();
  createForm  = () => new <Nombre>Form();
}
```

## 5. Registrar en `frontend/src/index.ts`
Agregar:
```typescript
import './modules/<nombre>/<nombre>.page';
import './modules/<nombre>/<nombre>.table';
import './modules/<nombre>/<nombre>.form';
```

## 6. Agregar ruta en `frontend/src/app-root.ts`
```typescript
{ path: '/<nombre>', component: '<nombre>-page' }
```

## 7. Actualizar CLAUDE.md
- Marcar módulo como ✅ en `## Módulos`
- Agregar endpoints a la tabla

## Nota
Completar el DTO, las columnas y los fields con los campos reales del backend antes de usar.
Ver tabla **FormField — opciones** en CLAUDE.md para referencia de los campos disponibles.
