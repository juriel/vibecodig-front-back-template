import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router, Commands, Context } from '@vaadin/router';
import { SessionStatus } from './lib/session';
import { GlobalConfig } from './global-config';
import { MENU, leaves } from './menu';
import './shell/app-sidebar';
import './shell/app-header';

const ADMIN = GlobalConfig.getInstance().adminBase;
const LOGIN = `${ADMIN}/login`;

/**
 * Guard de rutas (solo si `authRequired`): sin sesión → login; sin ninguno de los privilegios de su
 * entrada en menu.ts → inicio. El backend igualmente valida cada endpoint.
 */
const requireAuth = (ctx: Context, commands: Commands) => {
  if (!GlobalConfig.getInstance().authRequired) return undefined;
  const session = SessionStatus.getInstance();
  if (!session.isLoggedIn) return commands.redirect(LOGIN);
  const needed = leaves(MENU).find(i => i.path === ctx.pathname)?.privileges;
  if (needed?.length && !needed.some(p => session.can(p))) return commands.redirect(ADMIN);
  return undefined;
};

const protect = (routes: any[]) => routes.map(r => ({ ...r, action: requireAuth }));

@customElement('app-root')
export class AppRoot extends LitElement {
  @state() private collapsed = false;
  @state() private mobileOpen = false;
  @state() private path = location.pathname;

  createRenderRoot() { return this; }

  firstUpdated() {
    const router = new Router(this.querySelector('#outlet')!);
    router.setRoutes([
      { path: LOGIN, component: 'login-page' },
      ...protect([
        { path: ADMIN, component: 'home-page' },
        { path: `${ADMIN}/user`, component: 'user-page' },
        // Add routes here (antes de las secciones pendientes)
        ...leaves(MENU).filter(i => i.pending).map(i => ({ path: i.path!, component: 'pending-page' })),
      ]),
      { path: `${ADMIN}/(.*)`, redirect: ADMIN },
    ]);
    window.addEventListener('vaadin-router-location-changed', () => {
      this.path = location.pathname;
      this.mobileOpen = false;
    });
  }

  render() {
    const shell = this.path !== LOGIN;
    return html`
      <div class="flex min-h-screen">
        ${shell ? html`
          <app-sidebar .collapsed=${this.collapsed} .open=${this.mobileOpen} .path=${this.path}
                       @navigate=${() => { this.mobileOpen = false; }}></app-sidebar>` : nothing}
        <div class="flex min-w-0 flex-1 flex-col">
          ${shell ? html`
            <app-header @toggle-menu=${() => {
              if (window.matchMedia('(min-width: 768px)').matches) this.collapsed = !this.collapsed;
              else this.mobileOpen = !this.mobileOpen;
            }}></app-header>` : nothing}
          <main id="outlet" class=${shell ? 'flex-1 p-4 md:p-8' : 'flex-1'}></main>
        </div>
      </div>`;
  }
}
