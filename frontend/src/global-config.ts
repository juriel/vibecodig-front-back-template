import { I18n } from './lib/i18n';

export class GlobalConfig {
  private static instance: GlobalConfig;
  readonly apiUrl: string;
  /** Name shown on the login, the sidebar and the title (translatable: `app.name`). */
  get appName(): string { return I18n.t('app.name'); }
  /** The panel (SPA with login) lives under this prefix; `/` is the public site. Router and menu paths include it. */
  readonly adminBase = '/admin';
  /**
   * true → routes protected by the login page and actions filtered by privileges.
   * The backend exposes POST /api/auth/login and GET /api/auth/me.
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
