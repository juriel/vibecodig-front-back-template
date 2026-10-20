import axios from 'axios';
import { toast } from './toast';
import { GlobalConfig } from '../global-config';

/**
 * Sesión en localStorage: { token, user, privileges: string[] }.
 * Adjunta el Bearer token a cada request y redirige a /login ante 401.
 * Llamar SessionStatus.installInterceptors() una vez (en index.ts) si el proyecto usa auth.
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
  /** true si tiene el privilegio o el comodín "ALL". */
  can(code: string) { return this.hasPrivilege(code) || this.hasPrivilege('ALL'); }

  /** true si hay token y no ha expirado (se lee el `exp` del JWT; el servidor igual lo valida). */
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
   * Permiso para una acción de un módulo según la convención de la base: ACCION_ENTIDAD,
   * p. ej. allowed('user','edit') → EDIT_USER; create → ADD_, list/view → VIEW_. Siempre true si auth está desactivada.
   */
  allowed(prefix: string, action: 'list' | 'create' | 'edit' | 'delete' | 'view'): boolean {
    if (!GlobalConfig.getInstance().authRequired) return true;
    const verb = { list: 'VIEW', view: 'VIEW', create: 'ADD', edit: 'EDIT', delete: 'DELETE' }[action];
    return this.can(`${verb}_${prefix.toUpperCase().replace(/-/g, '_')}`);
  }

  logout(redirect = '/login') {
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
      if (status === 401 && !isLogin) SessionStatus.getInstance().logout();
      else if (status === 403) toast(err.response.data?.detail?.error ?? err.response.data?.detail ?? 'Acceso denegado', 'error');
      return Promise.reject(err);
    });
  }
}
