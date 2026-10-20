import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Construction } from 'lucide';
import { MENU } from '../../admin-menu';
import { icon } from '../../icons';

/** Marcador para las secciones del menú que todavía no se construyen. */
@customElement('pending-page')
export class PendingPage extends LitElement {
  createRenderRoot() { return this; }

  render() {
    const item = MENU.flatMap(g => g.items).find(i => i.path === window.location.pathname);
    return html`
      <div class="pending">
        ${icon(Construction, 56)}
        <h2>${item?.label ?? 'Sección'}</h2>
        <p>Esta sección está en construcción.</p>
        <a href="/admin">Volver al inicio</a>
      </div>`;
  }
}
