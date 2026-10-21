import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudTable } from './crud-table';
import { CrudForm } from './crud-form';
import { SessionStatus } from '../lib/session';
import { confirmDialog, toast } from '../lib/toast';
import { icon } from '../lib/icons';
import { titleBand, bandBtn } from '../lib/title-band';
import { MENU, leaves } from '../menu';
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

  /** Extra buttons for the title band in the list view (before "New"); a module overrides it to add its own. */
  protected bandActions(): unknown { return ''; }

  /** Opens a record in the edit form (e.g. one just created somewhere else). */
  protected openEdit(element: T) { this._showEdit(element); }

  /** Icon of this screen, taken from its menu entry. */
  private get _icon(): string | undefined {
    return leaves(MENU).find(i => i.path === location.pathname)?.icon;
  }

  private _renderToolbar(): TemplateResult {
    const canCreate = this.canCreate && SessionStatus.getInstance().allowed(this.permission, 'create');
    const action = this.view === 'list'
      ? (canCreate ? html`<button class=${bandBtn.accent} @click="${() => { this._form.reset(); this.view = 'create'; this.requestUpdate(); }}">${icon('plus', 'size-4')}${I18n.t('common.new')}</button>` : '')
      : html`<button class=${bandBtn.ghost} @click="${() => this._backToList()}">${icon('arrow-left', 'size-4')}${I18n.t('common.back')}</button>`;
    return titleBand(this.label, I18n.t('crud.subtitle.' + this.view), { icon: this._icon, actions: html`${this.view === 'list' ? this.bandActions() : ''}${action}` });
  }

  render(): TemplateResult {
    return html`
      ${this._renderToolbar()}
      ${this.view === 'list'   ? html`${this._table}` : ''}
      ${this.view === 'create' || this.view === 'edit' ? html`${this._form}` : ''}`;
  }
}
