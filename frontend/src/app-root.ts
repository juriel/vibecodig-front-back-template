import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

const NAV_ITEMS: any[] = [
  // { path: '/nombre', label: 'Nombre', icon: '📋' },
];

@customElement('app-root')
export class AppRoot extends LitElement {
  private router!: Router;
  @state() private collapsed = false;

  createRenderRoot() { return this; }

  firstUpdated() {
    const outlet = this.querySelector('#outlet')!;
    this.router = new Router(outlet);
    this.router.setRoutes([
      { path: '/', redirect: '/example' },
      { path: '/example', component: 'example-page' },
      // Add routes here
    ]);
  }

  render() {
    return html`
      <nav class="sidebar ${this.collapsed ? 'collapsed' : ''}">
        <div class="sidebar-header">
          <button class="sidebar-toggle" @click="${() => { this.collapsed = !this.collapsed; }}">&#9776;</button>
          ${this.collapsed ? '' : html`<span class="sidebar-title">App</span>`}
        </div>
        <ul class="sidebar-nav">
          ${NAV_ITEMS.map((item: any) => html`
            <li>
              <a class="nav-item" href="${item.path}">
                <span class="nav-icon">${item.icon}</span>
                ${this.collapsed ? '' : html`<span class="nav-label">${item.label}</span>`}
              </a>
            </li>
          `)}
        </ul>
      </nav>
      <main id="outlet"></main>
    `;
  }
}
