export class GlobalConfig {
  private static instance: GlobalConfig;
  readonly apiUrl: string;
  /** Nombre visible en login, sidebar y título. */
  readonly appName = 'Panel de contenidos';
  /** El panel (SPA con login) vive bajo este prefijo; `/` es el sitio público. Las rutas del router y del menú lo incluyen. */
  readonly adminBase = '/admin';
  /**
   * true → rutas protegidas por login (/login) y acciones filtradas por privilegios.
   * El backend expone POST /api/auth/login y GET /api/auth/me.
   */
  readonly authRequired = true;

  private constructor() {
    this.apiUrl = '/api/';
  }

  static getInstance(): GlobalConfig {
    if (!GlobalConfig.instance) GlobalConfig.instance = new GlobalConfig();
    return GlobalConfig.instance;
  }
}
