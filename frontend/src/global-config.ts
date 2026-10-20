export class GlobalConfig {
  private static instance: GlobalConfig;
  readonly apiUrl: string;
  /** Nombre visible en login, sidebar y título. */
  readonly appName = 'Project Name';
  /**
   * true → rutas protegidas por login (/login) y acciones filtradas por privilegios.
   * Dejar en false hasta que el backend exponga POST /api/auth/login.
   */
  readonly authRequired = false;

  private constructor() {
    this.apiUrl = '/api/';
  }

  static getInstance(): GlobalConfig {
    if (!GlobalConfig.instance) GlobalConfig.instance = new GlobalConfig();
    return GlobalConfig.instance;
  }
}
