import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router, Commands, Context } from '@vaadin/router';
import { SessionStatus } from './lib/session';
import { GlobalConfig } from './global-config';
import './shell/app-sidebar';
import './shell/app-header';

/** Redirige a /login si la auth está activa y no hay sesión. */
const requireAuth = (_ctx: Context, commands: Commands) =>
  !GlobalConfig.getInstance().authRequired || SessionStatus.getInstance().isLoggedIn
    ? undefined
    : commands.redirect('/login');

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
      { path: '/login', component: 'login-page' },
      ...protect([
        { path: '/', component: 'home-page' },
        { path: '/example', component: 'example-page' },
        { path: '/user', component: 'user-page' },
        // Add routes here
      ]),
      { path: '(.*)', redirect: '/' },
    ]);
    window.addEventListener('vaadin-router-location-changed', () => {
      this.path = location.pathname;
      this.mobileOpen = false;
    });
  }

  render() {
    const shell = this.path !== '/login';
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
