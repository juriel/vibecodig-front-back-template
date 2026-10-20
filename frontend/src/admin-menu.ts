import { IconNode, Settings, Wrench, Palette, FileCode, Layers, Globe, Puzzle, FolderOpen, File, LayoutGrid } from 'lucide';

/** Nombre que se muestra en el encabezado y en el login del panel. */
export const APP_NAME = 'Panel de contenidos';

export interface MenuItem { path: string; label: string; icon: IconNode; }
export interface MenuGroup { label: string; icon: IconNode; items: MenuItem[]; }

// Menú del panel (modelo: titi). El encabezado arma los desplegables y el inicio las tarjetas con estos datos.
export const MENU: MenuGroup[] = [
  {
    label: 'Configuración', icon: Settings, items: [
      { path: '/admin/configuraciones', label: 'Configuraciones globales', icon: Wrench },
      { path: '/admin/css', label: 'Hojas de estilo CSS', icon: Palette },
      { path: '/admin/javascripts', label: 'Javascripts', icon: FileCode },
      { path: '/admin/plantillas', label: 'Plantillas', icon: Layers },
    ],
  },
  {
    label: 'Contenido', icon: LayoutGrid, items: [
      { path: '/admin/paginas', label: 'Páginas', icon: Globe },
      { path: '/admin/widgets', label: 'Widgets', icon: Puzzle },
      { path: '/admin/carpetas', label: 'Gestión de carpetas', icon: FolderOpen },
      { path: '/admin/archivos', label: 'Gestión de archivos', icon: File },
    ],
  },
];
