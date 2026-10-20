import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudService } from './crud-service';
import { FormField } from './types';
import { ui, btn } from '../lib/ui';

export abstract class CrudForm<T extends object> extends LitElement {
  abstract prefix: string;
  abstract service: CrudService<T>;
  abstract fields(): FormField[];

  @property() mode: 'add' | 'edit' = 'add';
  @state() protected element: Partial<T> = {};
  @state() private errors: Record<string, string> = {};
  @state() private saving = false;

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    MessageBroker.subscribe(this as any, `${this.prefix}-load-edit`, ({ detail }) => {
      this.element = { ...detail.element };
      this.mode = 'edit';
      this.requestUpdate();
      this.updateComplete.then(() => this._populateInputs());
    });
  }

  disconnectedCallback() {
    MessageBroker.unsubscribeAll(this as any);
    super.disconnectedCallback();
  }

  private _populateInputs() {
    const inputs = this.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea');
    inputs.forEach(input => {
      const val = (this.element as any)[input.name];
      if (val !== undefined) input.value = String(val);
    });
  }

  private _readFormData(form: HTMLFormElement): Partial<T> {
    const dto: any = { ...this.element };
    new FormData(form).forEach((value, key) => { dto[key] = value; });
    return dto;
  }

  private _validate(dto: Partial<T>): Record<string, string> {
    const errs: Record<string, string> = {};
    this.fields().forEach(f => {
      const val = (dto as any)[f.key];
      if (f.required && (val === undefined || val === null || val === ''))
        errs[f.key] = `${f.label} es requerido`;
      if (f.validator && val !== undefined && !f.validator(val))
        errs[f.key] = `${f.label} no es válido`;
    });
    return errs;
  }

  private async _handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const dto = this._readFormData(e.target as HTMLFormElement);
    const errs = this._validate(dto);
    if (Object.keys(errs).length) { this.errors = errs; return; }

    this.saving = true;
    this.errors = {};
    try {
      const result = this.mode === 'add'
        ? await this.service.create(dto)
        : await this.service.update(dto as T);
      const event = this.mode === 'add' ? 'created' : 'edited';
      MessageBroker.publish(`${this.prefix}-${event}`, { element: result });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object' && detail.field_errors)
        this.errors = detail.field_errors;
      else
        this.errors['_global'] = typeof detail === 'string' ? detail : 'Error al guardar';
    } finally {
      this.saving = false;
    }
  }

  private _renderField(f: FormField): TemplateResult {
    const err = this.errors[f.key];
    const dis = f.disabled || this.saving;
    const cls = `${ui.input} ${err ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : ''}`;
    if (f.type === 'checkbox') {
      return html`
        <label class="mb-4 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" id="${f.key}" name="${f.key}" ?disabled=${dis} class="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          ${f.label}
        </label>`;
    }
    return html`
      <div class="mb-4">
        <label for="${f.key}" class=${ui.label}>${f.label}${f.required ? html`<span class="ml-0.5 text-red-500">*</span>` : ''}</label>
        ${f.type === 'textarea'
          ? html`<textarea id="${f.key}" name="${f.key}" rows="4" class=${cls} ?disabled=${dis}></textarea>`
          : f.type === 'select'
          ? html`<select id="${f.key}" name="${f.key}" class=${cls} ?disabled=${dis}>
              <option value="">-- Seleccionar --</option>
              ${Object.entries(f.options ?? {}).map(([v, l]) => html`<option value="${v}">${l}</option>`)}
            </select>`
          : html`<input id="${f.key}" name="${f.key}" type="${f.type ?? 'text'}" class=${cls} ?disabled=${dis} />`}
        ${err ? html`<p class="mt-1 text-xs text-red-600">${err}</p>` : ''}
      </div>`;
  }

  private _zone(zone: FormField['zone']) {
    return this.fields().filter(f => (f.zone ?? 'top') === zone);
  }

  render(): TemplateResult {
    const top    = this._zone('top');
    const left   = this._zone('left');
    const right  = this._zone('right');
    const bottom = this._zone('bottom');
    const hasLR  = left.length > 0 || right.length > 0;

    return html`
      <form class="${ui.card} max-w-3xl p-6" @submit="${this._handleSubmit.bind(this)}">
        <h3 class="mb-5 text-base font-semibold text-slate-900">${this.mode === 'add' ? 'Nuevo registro' : 'Editar registro'}</h3>
        ${this.errors['_global'] ? html`
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">${this.errors['_global']}</p>` : ''}
        <div>${top.map(f => this._renderField(f))}</div>
        ${hasLR ? html`
          <div class="grid gap-x-5 md:grid-cols-2">
            <div>${left.map(f => this._renderField(f))}</div>
            <div>${right.map(f => this._renderField(f))}</div>
          </div>` : ''}
        <div>${bottom.map(f => this._renderField(f))}</div>
        <div class="mt-2 flex justify-end gap-2 border-t border-slate-100 pt-5">
          <button type="button" class=${btn('secondary')} @click=${() => this.dispatchEvent(new CustomEvent('form-cancel', { bubbles: true }))}>Cancelar</button>
          <button type="submit" class=${btn('primary')} ?disabled="${this.saving}">${this.saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>`;
  }
}
