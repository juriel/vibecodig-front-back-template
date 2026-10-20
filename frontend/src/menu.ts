/**
 * Backoffice side menu (declarative). It also feeds the home page tiles.
 * - `label`: i18n key (`menu.*`), translated when rendered.
 * - `path`: full route, always under /admin (the panel lives at /admin; `/` is the public site).
 * - `privileges`: codes from the `privilege` table (e.g. VIEW_USER). Shown if the user has AT LEAST one (ALL allows everything).
 * - A group without visible children is hidden.
 * - `icon`: name of an icon from lib/icons.ts.
 * - `pending`: section not built yet; app-root shows it with <pending-page>.
 * When creating a module: add its entry here (and its route in app-root.ts).
 */
export interface MenuItem {
  label: string;
  icon?: string;
  path?: string;
  privileges?: string[];
  pending?: boolean;
  children?: MenuItem[];
}

const A = '/admin';

export const MENU: MenuItem[] = [
  { label: 'menu.home', icon: 'home', path: A },
  {
    label: 'menu.settings', icon: 'cog', children: [
      { label: 'menu.global_settings', icon: 'cog', path: `${A}/global-settings`, privileges: ['VIEW_GLOBAL_CONFIGURATION'], pending: true },
      { label: 'menu.css', icon: 'palette', path: `${A}/css`, privileges: ['VIEW_CMS_LAYOUT'] },
      { label: 'menu.javascripts', icon: 'code', path: `${A}/javascripts`, privileges: ['VIEW_CMS_LAYOUT'] },
      { label: 'menu.layouts', icon: 'layers', path: `${A}/layouts`, privileges: ['VIEW_CMS_LAYOUT'] },
    ],
  },
  {
    label: 'menu.content', icon: 'dashboard', children: [
      { label: 'menu.pages', icon: 'globe', path: `${A}/pages`, privileges: ['VIEW_CMS_PAGE'] },
      { label: 'menu.widgets', icon: 'dashboard', path: `${A}/widgets`, privileges: ['VIEW_CMS_PAGE'] },
      { label: 'menu.folders', icon: 'folder', path: `${A}/folders`, privileges: ['VIEW_FOLDER'], pending: true },
      { label: 'menu.files', icon: 'document', path: `${A}/files`, privileges: ['VIEW_FOLDER'], pending: true },
    ],
  },
  {
    label: 'menu.administration', icon: 'shield', children: [
      { label: 'menu.users', icon: 'users', path: `${A}/user`, privileges: ['VIEW_USER'] },
      { label: 'menu.profiles', icon: 'shield', path: `${A}/profile`, privileges: ['VIEW_PROFILE'] },
      { label: 'menu.privileges', icon: 'lock', path: `${A}/privilege`, privileges: ['VIEW_PROFILE'] },
    ],
  },
];

/** Menu leaves (sections with a route), in order. */
export const leaves = (items: MenuItem[] = MENU): MenuItem[] =>
  items.flatMap(i => (i.children ? leaves(i.children) : i.path ? [i] : []));
