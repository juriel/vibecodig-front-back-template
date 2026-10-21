import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MessageBroker } from '../crud/broker';
import { ui, btn } from './ui';
import { icon } from './icons';
import { I18n } from './i18n';
import { CrudService } from '../crud/crud-service';

/**
 * Autocomplete with debounce (300 ms) to pick a related entity (FK).
 * Stores the key in an <input type="hidden" name="<name>"> and shows the text in the visible input.
 * On selection it emits the DOM event `<name>-result-selected` (detail = item) and publishes it on the MessageBroker.
 *
 *   const f = new FinderSearch<CustomerDTO>();
 *   Object.assign(f, { name: 'customer_id', service: new CustomerService(), primaryKey: 'id', displayField: 'name' });
 *
 * Search: `search(q)` if defined (e.g. an endpoint with a filter); otherwise `service.findAll()` filtered on the client.
 */
@customElement('finder-search')
export class FinderSearch<T extends object = any> extends LitElement {
  @property() name = '';
  @property() placeholder = I18n.t('common.search');
  @property() primaryKey!: keyof T;
  @property() displayField!: keyof T;
  /** Label of the extra button (shown only with a selected value and `customFunction` defined). */
  @property() customButtonMessage = '';

  service?: CrudService<T>;
  search?: (q: string) => Promise<T[]>;
  displayFunction?: (item: T) => any;
  customFunction?: (key: string) => void;

  @state() private text = '';
  @state() private selected = '';
  @state() private results: T[] = [];

  private timer?: number;

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('click', this.onOutsideClick);
  }

  disconnectedCallback() {
    window.removeEventListener('click', this.onOutsideClick);
    clearTimeout(this.timer);
    super.disconnectedCallback();
  }

  private onOutsideClick = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) this.results = [];
  };

  private async fetchResults(q: string) {
    try {
      if (this.search) this.results = await this.search(q);
      else {
        const all = await this.service!.findAll();
        const needle = q.toLowerCase();
        this.results = all.filter(i => String(i[this.displayField] ?? '').toLowerCase().includes(needle));
      }
    } catch (e) {
      console.error(e);
      this.results = [];
    }
  }

  private onInput(e: Event) {
    this.text = (e.target as HTMLInputElement).value;
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.fetchResults(this.text), 300);
  }

  private choose(item: T) {
    this.text = String(item[this.displayField]);
    this.selected = String(item[this.primaryKey]);
    this.results = [];
    this.dispatchEvent(new CustomEvent<T>(`${this.name}-result-selected`, { detail: item, bubbles: true, composed: true }));
    MessageBroker.publish(`${this.name}-result-selected`, { item });
  }

  /** Clears the text and the selected key. */
  clear() {
    this.text = '';
    this.selected = '';
  }

  render() {
    return html`
      <div class="relative">
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">${icon('search', 'size-4')}</span>
            <input type="text" autocomplete="off" class="${ui.input} pl-9" .value=${this.text} placeholder=${this.placeholder}
                   @focus=${() => this.fetchResults(this.text)} @input=${this.onInput} />
          </div>
          ${this.selected ? html`<button type="button" class=${ui.iconBtn} title="${I18n.t('common.clear')}" @click=${this.clear}>${icon('x', 'size-4')}</button>` : ''}
          ${this.selected && this.customFunction
            ? html`<button type="button" class=${btn('secondary')} @click=${() => this.customFunction!(this.selected)}>${this.customButtonMessage}</button>` : ''}
        </div>
        <input type="hidden" name=${this.name} .value=${this.selected} />
        ${this.results.length ? html`
          <ul class="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-surface py-1 shadow-lg">
            ${this.results.map(i => html`
              <li class="cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700" @click=${() => this.choose(i)}>
                ${this.displayFunction ? this.displayFunction(i) : i[this.displayField]}
              </li>`)}
          </ul>` : ''}
      </div>`;
  }
}
