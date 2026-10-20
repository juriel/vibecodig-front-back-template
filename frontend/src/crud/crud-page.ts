import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudTable } from './crud-table';
import { CrudForm } from './crud-form';
import { SessionStatus } from '../lib/session';
import { confirmDialog, toast } from '../lib/toast';
import { icon } from '../lib/icons';
import { btn } from '../lib/ui';
import { I18n } from '../lib/i18n';

type CrudView = 'list' | 'create' | 'edit' | 'detail';

export abstract class CrudPage<T extends object> extends LitElement {
  abstract prefix: string;
  abstract label: string;
  abstract createTable(): CrudTable<T>;
  abstract createForm(): CrudForm<T>;
  /** false → no "New" button (read-only listings). */
  canCreate = true;
  /** Privilege prefix (ACTION_PREFIX). Defaults to the module prefix. */
  get permission(): string { return this.prefix; }

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
    MessageBroker.subscribe(this as any, `${this.prefix}-created`, () => { toast(I18n.t('crud.created'), 'success'); this._backToList(); });
    this.addEventListener('form-cancel', () => this._backToList());
    MessageBroker.subscribe(this as any, `${this.prefix}-edited`,  () => { toast(I18n.t('crud.saved'), 'success'); this._backToList(); });
  }

  disconnectedCallback() {
    MessageBroker.unsubscribeAll(this as any);
    super.disconnectedCallback();
  }

  private _showEdit(element: T) {
    this.view = 'edit';
    this._form.load(element);
    this.requestUpdate();
  }

  private _backToList() {
    this.view = 'list';
    this._form.reset();
    MessageBroker.publish(`${this.prefix}-update-list`, {});
    this.requestUpdate();
  }

  private async _confirmDelete(target: T) {
    const ok = await confirmDialog(I18n.t('crud.delete.text'), {
      title: I18n.t('crud.delete.title'), okLabel: I18n.t('common.delete'), danger: true,
    });
    if (!ok) return;
    const service = (this._form as any).service;
    try {
      await service.delete(service.getKey(target));
      toast(I18n.t('crud.deleted'), 'success');
      MessageBroker.publish(`${this.prefix}-update-list`, {});
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast(typeof detail === 'string' ? detail : I18n.t('crud.delete_error'), 'error');
    }
  }

  private _renderToolbar(): TemplateResult {
    const canCreate = this.canCreate && SessionStatus.getInstance().allowed(this.permission, 'create');
    return html`
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">${this.label}</h1>
          <p class="mt-0.5 text-sm text-slate-500">${I18n.t('crud.subtitle.' + this.view)}</p>
        </div>
        ${this.view === 'list'
          ? (canCreate ? html`<button class=${btn('primary')} @click="${() => { this._form.reset(); this.view = 'create'; this.requestUpdate(); }}">${icon('plus', 'size-4')}${I18n.t('common.new')}</button>` : '')
          : html`<button class=${btn('secondary')} @click="${() => this._backToList()}">${icon('arrow-left', 'size-4')}${I18n.t('common.back')}</button>`}
      </div>`;
  }

  render(): TemplateResult {
    return html`
      ${this._renderToolbar()}
      ${this.view === 'list'   ? html`${this._table}` : ''}
      ${this.view === 'create' || this.view === 'edit' ? html`${this._form}` : ''}`;
  }
}
