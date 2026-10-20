/**
 * Menú lateral del backoffice (declarativo). Alimenta también las tarjetas del inicio.
 * - `path`: ruta completa, siempre bajo /admin (el panel vive en /admin; `/` es el sitio público).
 * - `privileges`: códigos de la tabla `privilege` (p. ej. VIEW_USER). Se muestra si el usuario tiene AL MENOS uno (ALL lo permite todo).
 * - Un grupo sin hijos visibles se oculta.
 * - `icon`: nombre de un icono de lib/icons.ts.
 * - `pending`: sección aún sin construir; app-root la muestra con <pending-page>.
 * Al crear un módulo: añadir aquí su entrada (y su ruta en app-root.ts).
 */
export interface MenuItem {
  title: string;
  icon?: string;
  path?: string;
  privileges?: string[];
  pending?: boolean;
  children?: MenuItem[];
}

const A = '/admin';

export const MENU: MenuItem[] = [
  { title: 'Inicio', icon: 'home', path: A },
  {
    title: 'Configuración', icon: 'cog', children: [
      { title: 'Configuraciones globales', icon: 'cog', path: `${A}/configuraciones`, privileges: ['VIEW_GLOBAL_CONFIGURATION'], pending: true },
      { title: 'Hojas de estilo CSS', icon: 'palette', path: `${A}/css`, privileges: ['VIEW_CMS_LAYOUT'], pending: true },
      { title: 'Javascripts', icon: 'code', path: `${A}/javascripts`, privileges: ['VIEW_CMS_LAYOUT'], pending: true },
      { title: 'Plantillas', icon: 'layers', path: `${A}/plantillas`, privileges: ['VIEW_CMS_LAYOUT'], pending: true },
    ],
  },
  {
    title: 'Contenido', icon: 'dashboard', children: [
      { title: 'Páginas', icon: 'globe', path: `${A}/paginas`, privileges: ['VIEW_CMS_PAGE'], pending: true },
      { title: 'Widgets', icon: 'dashboard', path: `${A}/widgets`, privileges: ['VIEW_CMS_PAGE'], pending: true },
      { title: 'Gestión de carpetas', icon: 'folder', path: `${A}/carpetas`, privileges: ['VIEW_FOLDER'], pending: true },
      { title: 'Gestión de archivos', icon: 'document', path: `${A}/archivos`, privileges: ['VIEW_FOLDER'], pending: true },
    ],
  },
  {
    title: 'Administración', icon: 'shield', children: [
      { title: 'Usuarios', icon: 'users', path: `${A}/user`, privileges: ['VIEW_USER'] },
      // { title: 'Perfiles', icon: 'shield', path: `${A}/profile`, privileges: ['VIEW_PROFILE'] },
    ],
  },
];

/** Hojas del menú (secciones con ruta), en orden. */
export const leaves = (items: MenuItem[] = MENU): MenuItem[] =>
  items.flatMap(i => (i.children ? leaves(i.children) : i.path ? [i] : []));
