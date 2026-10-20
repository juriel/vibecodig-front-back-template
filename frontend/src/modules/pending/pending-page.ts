import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { MENU, leaves } from '../../menu';
import { GlobalConfig } from '../../global-config';
import { icon } from '../../lib/icons';
import { I18n } from '../../lib/i18n';

/** Placeholder for menu sections that are not built yet. */
@customElement('pending-page')
export class PendingPage extends LitElement {
  createRenderRoot() { return this; }

  render() {
    const item = leaves(MENU).find(i => i.path === window.location.pathname);
    return html`
      <div class="mx-auto mt-16 flex max-w-md flex-col items-center text-center">
        <span class="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">${icon(item?.icon ?? 'cog', 'size-8')}</span>
        <h1 class="mt-5 text-xl font-semibold text-slate-900">${item ? I18n.t(item.label) : I18n.t('pending.section')}</h1>
        <p class="mt-1 text-slate-500">${I18n.t('pending.text')}</p>
        <a href=${GlobalConfig.getInstance().adminBase} class="mt-5 text-sm font-medium text-brand-600 hover:text-brand-700">${I18n.t('pending.back')}</a>
      </div>`;
  }
}
