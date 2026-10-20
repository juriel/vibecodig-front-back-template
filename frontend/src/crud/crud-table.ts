import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudService } from './crud-service';
import { Column } from './types';

export abstract class CrudTable<T> extends LitElement {
  abstract prefix: string;
  abstract service: CrudService<T>;
  abstract columns(): Column<T>[];

  @property({ type: Boolean }) canEdit   = true;
  @property({ type: Boolean }) canDelete = true;
  @property({ type: Boolean }) canDetail = false;

  @state() protected items: T[] | null = null;
  @state() private error = false;
  private timeoutId?: number;

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    MessageBroker.subscribe(this as any, `${this.prefix}-update-list`, () => this.load());
    this.load();
  }

  disconnectedCallback() {
    MessageBroker.unsubscribeAll(this as any);
    clearTimeout(this.timeoutId);
    super.disconnectedCallback();
  }

  firstUpdated() {
    this.timeoutId = window.setTimeout(() => {
      if (this.items === null) this.error = true;
    }, 8000);
  }

  private async load() {
    this.items = null;
    this.error = false;
    try {
      this.items = await this.service.findAll();
    } catch {
      this.error = true;
    }
  }

  private _resolve(item: any, key: string): any {
    return key.split('.').reduce((acc, k) => acc?.[k], item);
  }

  private _renderCell(item: T, col: Column<T>): any {
    if (col.renderer) return col.renderer(item);
    const val = this._resolve(item, col.key);
    if (col.slice && typeof val === 'string' && val.length > col.slice)
      return val.slice(0, col.slice) + '…';
    return val ?? '';
  }

  render(): TemplateResult {
    if (this.error)
      return html`<p class="table-error">Error al cargar datos.</p>`;
    if (this.items === null)
      return html`<p class="table-loading">Cargando...</p>`;
    if (!this.items.length)
      return html`<p class="table-empty">Sin resultados.</p>`;

    const hasActions = this.canEdit || this.canDelete || this.canDetail;
    return html`
      <table class="crud-table">
        <thead>
          <tr>
            ${this.columns().map(c => html`<th>${c.label}</th>`)}
            ${hasActions ? html`<th>Acciones</th>` : ''}
          </tr>
        </thead>
        <tbody>
          ${this.items.map(item => html`
            <tr>
              ${this.columns().map(c => html`<td>${this._renderCell(item, c)}</td>`)}
              ${hasActions ? html`
                <td class="actions">
                  ${this.canDetail ? html`<button @click="${() => this._publish('detail', item)}" title="Ver">👁</button>` : ''}
                  ${this.canEdit   ? html`<button @click="${() => this._publish('edit',   item)}" title="Editar">✏️</button>` : ''}
                  ${this.canDelete ? html`<button @click="${() => this._publish('delete', item)}" title="Eliminar">🗑</button>` : ''}
                </td>` : ''}
            </tr>`)}
        </tbody>
      </table>`;
  }

  private _publish(action: string, item: T) {
    MessageBroker.publish(`${this.prefix}-${action}`, { element: item });
  }
}
