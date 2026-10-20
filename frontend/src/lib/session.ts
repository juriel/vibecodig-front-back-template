import axios from 'axios';
import { toast } from './toast';
import { I18n } from './i18n';
import { GlobalConfig } from '../global-config';

/**
 * Session stored in localStorage: { token, user, privileges: string[] }.
 * Attaches the Bearer token to every request and redirects to the login page on 401.
 * Call SessionStatus.installInterceptors() once (in boot.ts) if the project uses auth.
 */
export class SessionStatus {
  static readonly KEY = 'SESSION';
  private static instance: SessionStatus;
  static getInstance() { return (this.instance ??= new SessionStatus()); }

  private read(): any {
    try { return JSON.parse(localStorage.getItem(SessionStatus.KEY) ?? 'null'); } catch { return null; }
  }

  get token(): string | null { return this.read()?.token ?? null; }
  get user(): any { return this.read()?.user ?? null; }
  get privileges(): string[] { return this.read()?.privileges ?? []; }

  save(session: { token: string; user?: any; privileges?: string[] }) {
    localStorage.setItem(SessionStatus.KEY, JSON.stringify(session));
  }

  hasPrivilege(code: string) { return this.privileges.includes(code); }
  /** true if the user has the privilege or the "ALL" wildcard. */
  can(code: string) { return this.hasPrivilege(code) || this.hasPrivilege('ALL'); }

  /** true if there is a token and it has not expired (reads the JWT `exp`; the server validates it anyway). */
  get isLoggedIn(): boolean {
    const t = this.token;
    if (!t) return false;
    try {
      const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !payload.exp || payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  /**
   * Permission for a module action following the database convention: ACTION_ENTITY,
   * e.g. allowed('user','edit') → EDIT_USER; create → ADD_, list/view → VIEW_. Always true when auth is disabled.
   */
  allowed(prefix: string, action: 'list' | 'create' | 'edit' | 'delete' | 'view'): boolean {
    if (!GlobalConfig.getInstance().authRequired) return true;
    const verb = { list: 'VIEW', view: 'VIEW', create: 'ADD', edit: 'EDIT', delete: 'DELETE' }[action];
    return this.can(`${verb}_${prefix.toUpperCase().replace(/-/g, '_')}`);
  }

  logout(redirect = GlobalConfig.getInstance().adminBase + '/login') {
    localStorage.removeItem(SessionStatus.KEY);
    window.location.href = redirect;
  }

  static installInterceptors() {
    axios.interceptors.request.use(cfg => {
      const t = SessionStatus.getInstance().token;
      if (t) cfg.headers.Authorization = `Bearer ${t}`;
      return cfg;
    });
    axios.interceptors.response.use(r => r, err => {
      const status = err.response?.status;
      const isLogin = err.config?.url?.includes('auth/login');
      const detail = err.response?.data?.detail;
      if (status === 401 && !isLogin) SessionStatus.getInstance().logout();
      else if (status === 403) toast(typeof detail === 'string' ? detail : I18n.t('error.forbidden'), 'error');
      return Promise.reject(err);
    });
  }
}
