/**
 * Menú lateral del backoffice (declarativo).
 * - `privileges`: el ítem se muestra si el usuario tiene AL MENOS uno (o "ALL"). Vacío = visible para todos.
 * - Un grupo sin hijos visibles se oculta.
 * - `icon`: nombre de un icono de lib/icons.ts.
 * Al crear un módulo: añadir aquí su entrada (y su ruta en app-root.ts).
 */
export interface MenuItem {
  title: string;
  icon?: string;
  path?: string;
  privileges?: string[];
  children?: MenuItem[];
}

export const MENU: MenuItem[] = [
  { title: 'Inicio', icon: 'home', path: '/' },
  { title: 'Example', icon: 'dashboard', path: '/example' },
  // {
  //   title: 'Administración', icon: 'shield', children: [
  //     { title: 'Usuarios', icon: 'users', path: '/user', privileges: ['USER_LIST'] },
  //     { title: 'Roles',    icon: 'shield', path: '/role', privileges: ['ROLE_LIST'] },
  //   ],
  // },
];
