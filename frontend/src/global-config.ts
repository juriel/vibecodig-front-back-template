export class GlobalConfig {
  private static instance: GlobalConfig;
  readonly apiUrl: string;
  /** Nombre visible en login, sidebar y título. */
  readonly appName = 'Project Name';
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
