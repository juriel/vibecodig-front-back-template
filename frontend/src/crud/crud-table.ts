import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudService } from './crud-service';
import { Column } from './types';
import { SessionStatus } from '../lib/session';
import { icon } from '../lib/icons';
import { ui } from '../lib/ui';

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

  private _actionBtn(ico: string, title: string, action: string, item: T, hover = 'hover:text-brand-600') {
    return html`<button class="${ui.iconBtn} ${hover}" title=${title} @click=${() => this._publish(action, item)}>${icon(ico, 'size-4')}</button>`;
  }

  render(): TemplateResult {
    const session = SessionStatus.getInstance();
    const canEdit   = this.canEdit   && session.allowed(this.prefix, 'edit');
    const canDelete = this.canDelete && session.allowed(this.prefix, 'delete');
    const canDetail = this.canDetail && session.allowed(this.prefix, 'view');
    const hasActions = canEdit || canDelete || canDetail;

    let body: TemplateResult;
    const rows = this._filtered();
    const pages = Math.max(1, Math.ceil(rows.length / this.pageSize));
    if (this.page >= pages) this.page = pages - 1;
    const visible = rows.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize);

    if (this.error) body = this._state('Error al cargar los datos.', 'text-red-600', 'x');
    else if (this.items === null) body = html`
      <div class="flex items-center justify-center gap-3 px-6 py-14 text-slate-500">
        <span class="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"></span>Cargando…
      </div>`;
    else if (!rows.length) body = this._state(this.query ? 'Sin coincidencias para tu búsqueda.' : 'Aún no hay registros.');
    else body = html`
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              ${this.columns().map(c => html`<th class="px-4 py-3">${c.label}</th>`)}
              ${hasActions ? html`<th class="px-4 py-3 text-right">Acciones</th>` : ''}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${visible.map(item => html`
              <tr class="transition hover:bg-brand-50/40">
                ${this.columns().map(c => html`<td class="px-4 py-3 text-slate-700">${this._renderCell(item, c)}</td>`)}
                ${hasActions ? html`
                  <td class="px-4 py-2 text-right whitespace-nowrap">
                    ${canDetail ? this._actionBtn('eye', 'Ver', 'detail', item) : ''}
                    ${canEdit   ? this._actionBtn('pencil', 'Editar', 'edit', item) : ''}
                    ${canDelete ? this._actionBtn('trash', 'Eliminar', 'delete', item, 'hover:bg-red-50 hover:text-red-600') : ''}
                  </td>` : ''}
              </tr>`)}
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        <span>${rows.length} registro${rows.length === 1 ? '' : 's'}</span>
        ${pages > 1 ? html`
          <div class="flex items-center gap-1">
            <button class=${ui.iconBtn} ?disabled=${this.page === 0} @click=${() => { this.page--; }}>${icon('chevron-left', 'size-4')}</button>
            <span class="px-2">Página ${this.page + 1} de ${pages}</span>
            <button class=${ui.iconBtn} ?disabled=${this.page >= pages - 1} @click=${() => { this.page++; }}>${icon('chevron-right', 'size-4')}</button>
          </div>` : ''}
      </div>`;

    return html`
      <div class="${ui.card} overflow-hidden">
        <div class="border-b border-slate-200 p-4">
          <div class="relative max-w-xs">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">${icon('search', 'size-4')}</span>
            <input type="search" class="${ui.input} pl-9" placeholder="Buscar…" .value=${this.query}
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
