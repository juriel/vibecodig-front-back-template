import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { ChevronDown, LayoutDashboard, LogOut, Menu, User } from 'lucide';
import { MessageBroker } from './crud/broker';
import { AuthService, UserDTO, session } from './auth/auth-service';
import { APP_NAME, MENU } from './admin-menu';
import { icon } from './icons';

@customElement('app-root')
export class AppRoot extends LitElement {
  private router?: Router;
  @state() private user: UserDTO | null = null;
  @state() private checking = true;
  @state() private openMenu = '';        // desplegable abierto (label del grupo o 'user')
  @state() private navOpen = false;      // menú completo en pantallas angostas
  @state() private path = window.location.pathname;

  createRenderRoot() { return this; }

  async connectedCallback() {
    super.connectedCallback();
    MessageBroker.subscribe(this as any, 'auth-login', ({ detail }) => this._enter(detail.user));
    MessageBroker.subscribe(this as any, 'auth-expired', () => this._leave());
    document.addEventListener('click', this._closeOnOutside);
    document.addEventListener('keydown', this._closeOnEscape);
    window.addEventListener('vaadin-router-location-changed', this._onNavigate);
    try {
      await this._enter(await AuthService.me());
    } catch {
      this.user = null;
    } finally {
      this.checking = false;
    }
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._closeOnOutside);
    document.removeEventListener('keydown', this._closeOnEscape);
    window.removeEventListener('vaadin-router-location-changed', this._onNavigate);
    super.disconnectedCallback();
  }

  private _closeOnOutside = (e: Event) => {
    if (!(e.target as HTMLElement).closest?.('.dropdown')) this.openMenu = '';
  };

  private _closeOnEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { this.openMenu = ''; this.navOpen = false; }
  };

  private _onNavigate = () => {
    this.path = window.location.pathname;
    this.openMenu = '';
    this.navOpen = false;
  };

  private async _enter(user: UserDTO) {
    this.user = session.user = user;
    this.checking = false;
    await this.updateComplete;  // el #outlet existe solo después de renderizar el encabezado
    this.router?.unsubscribe();
    const outlet = this.querySelector('#outlet')!;
    this.router = new Router(outlet);
    this.router.setRoutes([
      { path: '/admin', component: 'dashboard-page' },
      { path: '/admin/example', component: 'example-page' },
      // Secciones del menú aún sin construir
      ...MENU.flatMap(g => g.items).map(i => ({ path: i.path, component: 'pending-page' })),
      { path: '/admin/(.*)', redirect: '/admin' },
    ]);
  }

  private _leave() {
    this.router?.unsubscribe();
    this.router = undefined;
    this.user = session.user = null;
  }

  private async _logout() {
    await AuthService.logout().catch(() => {});
    this._leave();
  }

  private _toggle(name: string) {
    this.openMenu = this.openMenu === name ? '' : name;
  }

  render() {
    if (this.checking) return html``;
    if (!this.user) return html`<login-page></login-page>`;
    return html`
      <header class="topbar">
        <a class="brand" href="/admin">${icon(LayoutDashboard, 30)}<span>${APP_NAME}</span></a>
        <button class="nav-toggle" aria-label="Abrir menú" aria-expanded="${this.navOpen}"
                @click="${() => { this.navOpen = !this.navOpen; }}">${icon(Menu, 22)}</button>
        <nav class="topnav ${this.navOpen ? 'open' : ''}" aria-label="Menú principal">
          ${MENU.map(g => html`
            <div class="dropdown">
              <button class="dropdown-toggle ${g.items.some(i => this.path.startsWith(i.path)) ? 'active' : ''}"
                      aria-expanded="${this.openMenu === g.label}" @click="${() => this._toggle(g.label)}">
                ${icon(g.icon, 16)}<span>${g.label}</span>${icon(ChevronDown, 14)}
              </button>
              ${this.openMenu === g.label ? html`
                <ul class="dropdown-menu">
                  ${g.items.map(i => html`
                    <li><a href="${i.path}" class="${this.path.startsWith(i.path) ? 'active' : ''}">${icon(i.icon, 16)}${i.label}</a></li>`)}
                </ul>` : ''}
            </div>`)}
        </nav>
        <div class="dropdown user-menu">
          <button class="dropdown-toggle" aria-expanded="${this.openMenu === 'user'}" @click="${() => this._toggle('user')}">
            ${icon(User, 16)}<span>${this.user.name}</span>${icon(ChevronDown, 14)}
          </button>
          ${this.openMenu === 'user' ? html`
            <ul class="dropdown-menu dropdown-menu-right">
              <li><button @click="${this._logout}">${icon(LogOut, 16)}Cerrar sesión</button></li>
            </ul>` : ''}
        </div>
      </header>
      <main id="outlet"></main>
    `;
  }
}
