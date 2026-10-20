import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CrudService } from '../crud/crud-service';
import { ui } from './ui';

/**
 * <select> fed by a CrudService (FKs / catalogs). Emits 'change' with detail = the selected value(s).
 *   const s = new SelectFromService<ChatbotDTO>();
 *   Object.assign(s, { service: new ChatbotService(), getValue: c => c.id!, getText: c => c.name, name: 'chatbot_id' });
 */
@customElement('select-from-service')
export class SelectFromService<T = any> extends LitElement {
  @property() name = '';
  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean }) includeNone = true;
  @property() value: string | string[] = '';

  service!: CrudService<T>;
  getValue: (e: T) => string | number = (e: any) => e.id;
  getText: (e: T) => string = (e: any) => e.name;

  @state() private items: T[] = [];

  createRenderRoot() { return this; }

  async connectedCallback() {
    super.connectedCallback();
    this.items = await this.service.findAll();
  }

  private isSelected(e: T) {
    const v = String(this.getValue(e));
    return Array.isArray(this.value) ? this.value.includes(v) : this.value === v;
  }

  private onChange(ev: Event) {
    const sel = ev.target as HTMLSelectElement;
    this.value = this.multiple ? Array.from(sel.selectedOptions).map(o => o.value) : sel.value;
    this.dispatchEvent(new CustomEvent('change', { detail: this.value, bubbles: true }));
  }

  render() {
    return html`
      <select class=${ui.input} name=${this.name} ?multiple=${this.multiple} @change=${this.onChange}>
        ${this.includeNone && !this.multiple ? html`<option value=""></option>` : ''}
        ${this.items.map(e => html`<option value=${this.getValue(e)} ?selected=${this.isSelected(e)}>${this.getText(e)}</option>`)}
      </select>`;
  }
}
