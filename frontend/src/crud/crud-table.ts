import { LitElement, html, TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudService } from './crud-service';
import { Column } from './types';
import { SessionStatus } from '../lib/session';
import { icon } from '../lib/icons';
import { ui } from '../lib/ui';
import { I18n } from '../lib/i18n';

export abstract class CrudTable<T> extends LitElement {
  abstract prefix: string;
  abstract service: CrudService<T>;
  abstract columns(): Column<T>[];

  @property({ type: Boolean }) canEdit   = true;
  @property({ type: Boolean }) canDelete = true;
  @property({ type: Boolean }) canDetail = false;

  @state() protected items: T[] | null = null;
  @state() private error = false;
  @state() private query = '';
  @state() private page = 0;
  @property({ type: Number }) pageSize = 10;
  private timeoutId?: number;

  /** Privilege prefix (ACTION_PREFIX). Defaults to the module prefix; override it when sharing privileges with another module. */
  get permission(): string { return this.prefix; }

  /** Per-row actions: override to hide edit/delete on certain records. */
  canEditRow(_item: T): boolean { return true; }
  canDeleteRow(_item: T): boolean { return true; }

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

  private _filtered(): T[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.items ?? [];
    const cols = this.columns();
    return (this.items ?? []).filter(item =>
      cols.some(c => String(this._resolve(item, c.key) ?? '').toLowerCase().includes(q)));
  }

  private _state(msg: string, tone = 'text-slate-500', ico = 'inbox'): TemplateResult {
    return html`
      <div class="flex flex-col items-center gap-2 px-6 py-14 ${tone}">
        ${icon(ico, 'size-9 opacity-60')}<p class="text-sm">${msg}</p>
      </div>`;
  }

  /** Row actions as small colored buttons (TitiCMS style): view blue, edit green, delete red. */
  private _actionBtn(ico: string, title: string, action: string, item: T, color: string) {
    return html`<button class="inline-flex size-8 items-center justify-center rounded-lg shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-brand-500/30 ${color}"
                        title=${title} aria-label=${title} @click=${() => this._publish(action, item)}>${icon(ico, 'size-4')}</button>`;
  }

  /**
   * Pagination: the classic controls (outlined arrow circles, numbered circles, current page filled) with motion —
   * the filled circle slides to the chosen page and a progress line shows how far through the list you are.
   */
  private _pager(pages: number): TemplateResult {
    const go = (n: number) => { this.page = Math.min(pages - 1, Math.max(0, n)); };
    const start = Math.max(0, Math.min(this.page - 1, pages - 3));
    const window = Array.from({ length: Math.min(3, pages) }, (_, i) => start + i);
    const items: (number | '…')[] = [];
    if (window[0] > 0) items.push(0, ...(window[0] > 1 ? ['…' as const] : []));
    items.push(...window);
    const last = window[window.length - 1];
    if (last < pages - 1) items.push(...(last < pages - 2 ? ['…' as const] : []), pages - 1);
    const arrow = (ico: string, label: string, to: number, disabled: boolean, nudge: string) => html`
      <button class="group inline-flex size-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-brand-500 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-35"
              title=${label} aria-label=${label} ?disabled=${disabled} @click=${() => go(to)}>
        <span class="transition-transform duration-200 ${nudge}">${icon(ico, 'size-4')}</span>
      </button>`;
    return html`
      <nav class="flex items-center gap-1.5" aria-label=${I18n.t('crud.pagination')}>
        ${arrow('chevron-double-left', I18n.t('crud.first_page'), 0, this.page === 0, 'group-hover:-translate-x-0.5')}
        ${arrow('chevron-left', I18n.t('crud.prev_page'), this.page - 1, this.page === 0, 'group-hover:-translate-x-0.5')}
        <div class="pager-track relative mx-1 flex items-center gap-1 rounded-full bg-slate-100 p-1">
          <span class="pager-indicator absolute left-0 top-1 h-9 w-9 rounded-full bg-brand-500 shadow-md transition-[transform,width] duration-500 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)]" aria-hidden="true"></span>
          ${items.map(n => n === '…'
            ? html`<span class="relative w-5 text-center text-sm text-slate-400" aria-hidden="true">…</span>`
            : html`<button class="relative inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold transition-colors duration-300 ${n === this.page ? 'text-on-primary' : 'text-slate-700 hover:text-brand-600'}"
                           aria-current=${n === this.page ? 'page' : 'false'} @click=${() => go(n)}>${n + 1}</button>`)}
        </div>
        ${arrow('chevron-right', I18n.t('crud.next_page'), this.page + 1, this.page >= pages - 1, 'group-hover:translate-x-0.5')}
        ${arrow('chevron-double-right', I18n.t('crud.last_page'), pages - 1, this.page >= pages - 1, 'group-hover:translate-x-0.5')}
      </nav>`;
  }

  /** Moves the pager's filled circle onto the current page (it slides thanks to its CSS transition). */
  protected updated(changed: Map<PropertyKey, unknown>) {
    super.updated(changed);
    const track = this.querySelector<HTMLElement>('.pager-track');
    const indicator = track?.querySelector<HTMLElement>('.pager-indicator');
    const active = track?.querySelector<HTMLElement>('[aria-current="page"]');
    if (indicator && active) {
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
      indicator.style.width = `${active.offsetWidth}px`;
    }
  }

  render(): TemplateResult {
    const session = SessionStatus.getInstance();
    const canEdit   = this.canEdit   && session.allowed(this.permission, 'edit');
    const canDelete = this.canDelete && session.allowed(this.permission, 'delete');
    const canDetail = this.canDetail && session.allowed(this.permission, 'view');
    const hasActions = canEdit || canDelete || canDetail;

    let body: TemplateResult;
    const rows = this._filtered();
    const pages = Math.max(1, Math.ceil(rows.length / this.pageSize));
    if (this.page >= pages) this.page = pages - 1;
    const visible = rows.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize);

    if (this.error) body = this._state(I18n.t('crud.load_error'), 'text-red-600', 'x');
    else if (this.items === null) body = html`
      <div class="flex items-center justify-center gap-3 px-6 py-14 text-slate-500">
        <span class="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"></span>${I18n.t('common.loading')}
      </div>`;
    else if (!rows.length) body = this._state(this.query ? I18n.t('crud.no_matches') : I18n.t('crud.empty'));
    else body = html`
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-accent-500 text-sm font-semibold text-on-accent">
            <tr>
              ${this.columns().map(c => html`<th class="px-4 py-3">${c.label}</th>`)}
              ${hasActions ? html`<th class="px-4 py-3 text-right">${I18n.t('common.actions')}</th>` : ''}
            </tr>
          </thead>
          ${keyed(`${this.page}|${this.query}`, html`<tbody class="rows-in divide-y divide-slate-200">
            ${visible.map(item => html`
              <tr class="transition even:bg-slate-50 hover:bg-brand-50">
                ${this.columns().map(c => html`<td class="px-4 py-3 text-slate-700">${this._renderCell(item, c)}</td>`)}
                ${hasActions ? html`
                  <td class="space-x-1 px-4 py-2 text-right whitespace-nowrap">
                    ${canDetail ? this._actionBtn('eye', I18n.t('common.view'), 'detail', item, 'bg-brand-500 text-on-primary') : ''}
                    ${canEdit && this.canEditRow(item) ? this._actionBtn('pencil', I18n.t('common.edit'), 'edit', item, 'bg-[#16a34a] text-white') : ''}
                    ${canDelete && this.canDeleteRow(item) ? this._actionBtn('trash', I18n.t('common.delete'), 'delete', item, 'bg-[#dc2626] text-white') : ''}
                  </td>` : ''}
              </tr>`)}
          </tbody>`)}
        </table>
      </div>
      <div class="flex flex-col items-center gap-3 border-t border-slate-200 px-4 py-4">
        ${pages > 1 ? this._pager(pages) : ''}
        <div class="flex flex-col items-center gap-1.5">
          ${pages > 1 ? html`
            <div class="h-1 w-40 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div class="pager-progress h-full rounded-full bg-accent-500 transition-[width] duration-500 ease-out" style="width:${((this.page + 1) / pages) * 100}%"></div>
            </div>` : ''}
          <span class="text-sm font-medium text-slate-600">${I18n.t('crud.showing', this.page * this.pageSize + 1, this.page * this.pageSize + visible.length, rows.length)}</span>
        </div>
      </div>`;

    return html`
      <div class="${ui.card} overflow-hidden">
        <div class="border-b border-slate-200 p-4">
          <div class="relative max-w-xl">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">${icon('search', 'size-4')}</span>
            <input type="search" class="${ui.input} pl-9" placeholder="${I18n.t('common.search_placeholder')}" .value=${this.query}
                   @input=${(e: Event) => { this.query = (e.target as HTMLInputElement).value; this.page = 0; }} />
          </div>
        </div>
        ${body}
      </div>`;
  }

  private _publish(action: string, item: T) {
    MessageBroker.publish(`${this.prefix}-${action}`, { element: item });
  }
}
