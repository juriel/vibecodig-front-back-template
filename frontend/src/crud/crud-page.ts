import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudTable } from './crud-table';
import { CrudForm } from './crud-form';
import { SessionStatus } from '../lib/session';
import { confirmDialog, toast } from '../lib/toast';
import { icon } from '../lib/icons';
import { btn } from '../lib/ui';

type CrudView = 'list' | 'create' | 'edit' | 'detail';

export abstract class CrudPage<T extends object> extends LitElement {
  abstract prefix: string;
  abstract label: string;
  abstract createTable(): CrudTable<T>;
  abstract createForm(): CrudForm<T>;

  @state() private view: CrudView = 'list';

  private _table!: CrudTable<T>;
  private _form!: CrudForm<T>;

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this._table = this.createTable();
    this._form  = this.createForm();

    MessageBroker.subscribe(this as any, `${this.prefix}-edit`,    ({ detail }) => this._showEdit(detail.element));
    MessageBroker.subscribe(this as any, `${this.prefix}-delete`,  ({ detail }) => this._confirmDelete(detail.element));
    MessageBroker.subscribe(this as any, `${this.prefix}-detail`,  ({ detail }) => { this.view = 'detail'; this.requestUpdate(); });
    MessageBroker.subscribe(this as any, `${this.prefix}-created`, () => { toast('Registro creado', 'success'); this._backToList(); });
    this.addEventListener('form-cancel', () => this._backToList());
    MessageBroker.subscribe(this as any, `${this.prefix}-edited`,  () => { toast('Cambios guardados', 'success'); this._backToList(); });
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

  private async _confirmDelete(target: T) {
    const ok = await confirmDialog('Esta acción no se puede deshacer.', {
      title: '¿Eliminar este elemento?', okLabel: 'Eliminar', danger: true,
    });
    if (!ok) return;
    const service = (this._form as any).service;
    try {
      await service.delete(service.getKey(target));
      toast('Registro eliminado', 'success');
      MessageBroker.publish(`${this.prefix}-update-list`, {});
    } catch {
      toast('No se pudo eliminar el registro', 'error');
    }
  }

  private _renderToolbar(): TemplateResult {
    const canCreate = SessionStatus.getInstance().allowed(this.prefix, 'create');
    return html`
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">${this.label}</h1>
          <p class="mt-0.5 text-sm text-slate-500">${this.view === 'list' ? 'Administra los registros.' : this.view === 'create' ? 'Crear un nuevo registro.' : 'Modificar el registro seleccionado.'}</p>
        </div>
        ${this.view === 'list'
          ? (canCreate ? html`<button class=${btn('primary')} @click="${() => { this.view = 'create'; this.requestUpdate(); }}">${icon('plus', 'size-4')}Nuevo</button>` : '')
          : html`<button class=${btn('secondary')} @click="${() => this._backToList()}">${icon('arrow-left', 'size-4')}Volver</button>`}
      </div>`;
  }

  render(): TemplateResult {
    return html`
      ${this._renderToolbar()}
      ${this.view === 'list'   ? html`${this._table}` : ''}
      ${this.view === 'create' || this.view === 'edit' ? html`${this._form}` : ''}`;
  }
}
