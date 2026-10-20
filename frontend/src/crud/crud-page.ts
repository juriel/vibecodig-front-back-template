import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudTable } from './crud-table';
import { CrudForm } from './crud-form';

type CrudView = 'list' | 'create' | 'edit' | 'detail';

export abstract class CrudPage<T extends object> extends LitElement {
  abstract prefix: string;
  abstract label: string;
  abstract createTable(): CrudTable<T>;
  abstract createForm(): CrudForm<T>;

  @state() private view: CrudView = 'list';
  @state() private deleteTarget: T | null = null;
  @state() private deleting = false;

  private _table!: CrudTable<T>;
  private _form!: CrudForm<T>;

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this._table = this.createTable();
    this._form  = this.createForm();

    MessageBroker.subscribe(this as any, `${this.prefix}-edit`,    ({ detail }) => this._showEdit(detail.element));
    MessageBroker.subscribe(this as any, `${this.prefix}-delete`,  ({ detail }) => { this.deleteTarget = detail.element; this.requestUpdate(); });
    MessageBroker.subscribe(this as any, `${this.prefix}-detail`,  ({ detail }) => { this.view = 'detail'; this.requestUpdate(); });
    MessageBroker.subscribe(this as any, `${this.prefix}-created`, () => this._backToList());
    MessageBroker.subscribe(this as any, `${this.prefix}-edited`,  () => this._backToList());
  }

  disconnectedCallback() {
    MessageBroker.unsubscribeAll(this as any);
    super.disconnectedCallback();
  }

  private _showEdit(element: T) {
    this.view = 'edit';
    this._form.mode = 'edit';
    MessageBroker.publish(`${this.prefix}-load-edit`, { element });
    this.requestUpdate();
  }

  private _backToList() {
    this.view = 'list';
    this._form.mode = 'add';
    MessageBroker.publish(`${this.prefix}-update-list`, {});
    this.requestUpdate();
  }

  private async _confirmDelete() {
    if (!this.deleteTarget) return;
    this.deleting = true;
    try {
      await (this._form as any).service.delete(
        (this._form as any).service.getKey(this.deleteTarget)
      );
      MessageBroker.publish(`${this.prefix}-update-list`, {});
    } finally {
      this.deleteTarget = null;
      this.deleting = false;
    }
  }

  private _renderToolbar(): TemplateResult {
    return html`
      <div class="crud-toolbar">
        <h2>${this.label}</h2>
        ${this.view === 'list'
          ? html`<button @click="${() => { this.view = 'create'; this.requestUpdate(); }}">+ Nuevo</button>`
          : html`<button @click="${() => this._backToList()}">← Volver</button>`}
      </div>`;
  }

  private _renderDeleteConfirm(): TemplateResult {
    if (!this.deleteTarget) return html``;
    return html`
      <div class="crud-delete-overlay">
        <div class="crud-delete-dialog">
          <p>¿Eliminar este elemento?</p>
          <button @click="${() => this._confirmDelete()}" ?disabled="${this.deleting}">
            ${this.deleting ? 'Eliminando...' : 'Confirmar'}
          </button>
          <button @click="${() => { this.deleteTarget = null; this.requestUpdate(); }}">Cancelar</button>
        </div>
      </div>`;
  }

  render(): TemplateResult {
    return html`
      ${this._renderToolbar()}
      ${this.view === 'list'   ? html`${this._table}` : ''}
      ${this.view === 'create' || this.view === 'edit' ? html`${this._form}` : ''}
      ${this._renderDeleteConfirm()}`;
  }
}
