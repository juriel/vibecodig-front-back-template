import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { I18n } from '../lib/i18n';
import { icon } from '../lib/icons';

/** Language selector. Stores the choice and reloads, so every view is rendered again in the new language. */
@customElement('lang-switch')
export class LangSwitch extends LitElement {
  createRenderRoot() { return this; }

  private change(e: Event) {
    I18n.setLanguage((e.target as HTMLSelectElement).value);
    window.location.reload();
  }

  render() {
    return html`
      <label class="relative inline-flex items-center text-slate-500" title=${I18n.t('header.language')}>
        ${icon('globe', 'size-4 absolute left-2 pointer-events-none')}
        <select aria-label=${I18n.t('header.language')} @change=${this.change}
                class="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-brand-500/15">
          ${Object.entries(I18n.supported).map(([code, name]) => html`<option value=${code} ?selected=${code === I18n.lang}>${name}</option>`)}
        </select>
      </label>`;
  }
}
