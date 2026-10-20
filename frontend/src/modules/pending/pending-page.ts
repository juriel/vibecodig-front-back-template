import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { MENU, leaves } from '../../menu';
import { GlobalConfig } from '../../global-config';
import { icon } from '../../lib/icons';

/** Marcador para las secciones del menú que todavía no se construyen. */
@customElement('pending-page')
export class PendingPage extends LitElement {
  createRenderRoot() { return this; }

  render() {
    const item = leaves(MENU).find(i => i.path === window.location.pathname);
    return html`
      <div class="mx-auto mt-16 flex max-w-md flex-col items-center text-center">
        <span class="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">${icon(item?.icon ?? 'cog', 'size-8')}</span>
        <h1 class="mt-5 text-xl font-semibold text-slate-900">${item?.title ?? 'Sección'}</h1>
        <p class="mt-1 text-slate-500">Esta sección está en construcción.</p>
        <a href=${GlobalConfig.getInstance().adminBase} class="mt-5 text-sm font-medium text-brand-600 hover:text-brand-700">Volver al inicio</a>
      </div>`;
  }
}
