import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ExampleService, ExampleDTO } from './example-service';
import { ui } from '../../lib/ui';
import { I18n } from '../../lib/i18n';

@customElement('example-page')
export class ExamplePage extends LitElement {
  @state() items: ExampleDTO[] = [];
  @state() loading = false;

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  async load() {
    this.loading = true;
    try { this.items = await ExampleService.findAll(); } finally { this.loading = false; }
  }

  render() {
    return html`
      <h1 class="mb-6 text-2xl font-semibold tracking-tight text-slate-900">${I18n.t('example.title')}</h1>
      <div class="${ui.card} divide-y divide-slate-100">
        ${this.loading
          ? html`<p class="p-6 text-slate-500">${I18n.t('common.loading')}</p>`
          : this.items.length
            ? this.items.map(i => html`<div class="px-5 py-3 text-slate-700">${i.name}</div>`)
            : html`<p class="p-6 text-slate-500">${I18n.t('crud.empty')}</p>`}
      </div>`;
  }
}
