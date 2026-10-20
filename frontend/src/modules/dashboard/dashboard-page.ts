import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { session } from '../../auth/auth-service';
import { MENU } from '../../admin-menu';
import { icon } from '../../icons';

@customElement('dashboard-page')
export class DashboardPage extends LitElement {
  createRenderRoot() { return this; }

  render() {
    return html`
      <h1 class="welcome">¡Bienvenido, ${session.user?.name}!</h1>
      <div class="tiles">
        ${MENU.flatMap(g => g.items).map(item => html`
          <a class="tile" href="${item.path}">
            ${icon(item.icon, 64)}
            <span>${item.label}</span>
          </a>`)}
      </div>`;
  }
}
