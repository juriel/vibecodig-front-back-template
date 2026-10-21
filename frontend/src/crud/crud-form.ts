import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudService } from './crud-service';
import { FormField } from './types';
import { ui, btn } from '../lib/ui';
import { I18n } from '../lib/i18n';
import '../lib/code-editor';

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
    MessageBroker.subscribe(this as any, `${this.prefix}-load-edit`, ({ detail }) => this.load(detail.element));
  }

  disconnectedCallback() {
    MessageBroker.unsubscribeAll(this as any);
    super.disconnectedCallback();
  }

  /** Loads an element for editing. Works even if the form is not in the DOM yet. */
  load(element: T) {
    this.element = { ...element };
    this.errors = {};
    this.mode = 'edit';
    this.updateComplete.then(() => { this.querySelector('form')?.reset(); this.repopulate(); });
  }

  /** Clears the state for a new record (avoids carrying over data from a previous edit). */
  reset() {
    this.element = {};
    this.errors = {};
    this.mode = 'add';
    this.updateComplete.then(() => { this.querySelector('form')?.reset(); this._applyDefaults(); this._announceTextareas(); });
  }

  /** Sets the `default` value of each field (only for new records). */
  private _applyDefaults() {
    const form = this.querySelector('form');
    if (!form || this.mode !== 'add') return;
    for (const f of this.fields()) {
      if (f.default === undefined) continue;
      const input = form.elements.namedItem(f.key) as HTMLInputElement | null;
      if (!input) continue;
      if (input.type === 'checkbox') input.checked = !!f.default;
      else input.value = String(f.default);
    }
  }

  /** Writes `element` into the inputs. Call again if a select/checkboxes' options arrive late. */
  protected repopulate() { this._populateInputs(); this._announceTextareas(); }

  /** Values set from code fire no event; code editors over a textarea listen to 'input' to stay in sync. */
  private _announceTextareas() {
    this.querySelectorAll('textarea').forEach(t => t.dispatchEvent(new Event('input', { bubbles: true })));
  }

  private _populateInputs() {
    const inputs = this.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea');
    inputs.forEach(input => {
      const val = (this.element as any)[input.name];
      if (val === undefined || val === null) return;
      if (input instanceof HTMLInputElement && input.type === 'checkbox') {
        input.checked = Array.isArray(val) ? val.map(String).includes(input.value) : !!val;
      } else {
        input.value = String(val);
      }
    });
  }

  private _readFormData(form: HTMLFormElement): Partial<T> {
    const dto: any = { ...this.element };
    const data = new FormData(form);
    data.forEach((value, key) => { dto[key] = value; });
    this.fields().forEach(f => {
      if (f.type === 'checkboxes') dto[f.key] = data.getAll(f.key);
      else if (f.type === 'checkbox') dto[f.key] = data.has(f.key);
    });
    return dto;
  }

  private _validate(dto: Partial<T>): Record<string, string> {
    const errs: Record<string, string> = {};
    this.fields().forEach(f => {
      const val = (dto as any)[f.key];
      if (f.required && (val === undefined || val === null || val === ''))
        errs[f.key] = I18n.t('form.required', f.label);
      if (f.validator && val !== undefined && !f.validator(val))
        errs[f.key] = I18n.t('form.invalid', f.label);
    });
    return errs;
  }

  /** Maps FastAPI/Pydantic validation errors to per-field messages (translated by error type). */
  private _validationErrors(details: any[]): Record<string, string> {
    const keys = new Set(this.fields().map(f => f.key));
    const errors: Record<string, string> = {};
    for (const d of details) {
      const field = d.loc?.[1];
      const i18nKey = 'validation.' + d.type;
      const translated = I18n.t(i18nKey, ...Object.values(d.ctx ?? {}));
      const message = translated === i18nKey ? d.msg : translated;
      if (keys.has(field)) errors[field] = message;
      else errors._global = [errors._global, message].filter(Boolean).join(' · ');
    }
    return errors;
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
      if (detail && typeof detail === 'object' && !Array.isArray(detail) && detail.field_errors)
        this.errors = detail.field_errors;
      else if (Array.isArray(detail))   // Pydantic validation (422)
        this.errors = this._validationErrors(detail as any[]);
      else
        this.errors = { _global: typeof detail === 'string' ? detail : I18n.t('crud.save_error') };
    } finally {
      this.saving = false;
    }
  }

  private _renderField(f: FormField): TemplateResult {
    const err = this.errors[f.key];
    const dis = f.disabled || this.saving;
    const cls = `${ui.input} ${err ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : ''}`;
    if (f.type === 'checkboxes' && f.groups) {
      const toggleGroup = (e: Event) => {
        const box = (e.currentTarget as HTMLElement).closest('[data-group]')!;
        const inputs = Array.from(box.querySelectorAll<HTMLInputElement>('input[type=checkbox]'));
        const all = inputs.every(i => i.checked);
        inputs.forEach(i => { i.checked = !all; });
      };
      return html`
        <fieldset class="mb-4">
          <legend class=${ui.label}>${f.label}</legend>
          <div class="space-y-3">
            ${Object.entries(f.groups).map(([group, opts]) => html`
              <div data-group class="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-sm font-semibold text-slate-700">${group}</span>
                  <button type="button" class="text-xs font-medium text-brand-600 hover:text-brand-700" ?disabled=${dis} @click=${toggleGroup}>${I18n.t('common.all_none')}</button>
                </div>
                <div class="grid gap-x-5 gap-y-2 sm:grid-cols-2">
                  ${Object.entries(opts).map(([v, l]) => html`
                    <label class="flex items-center gap-2 text-sm text-slate-700" title=${v}>
                      <input type="checkbox" name="${f.key}" value="${v}" ?disabled=${dis}
                             class="size-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />${l}
                    </label>`)}
                </div>
              </div>`)}
            ${Object.keys(f.groups).length ? '' : html`<span class="text-sm text-slate-400">${I18n.t('common.no_options')}</span>`}
          </div>
        </fieldset>`;
    }
    if (f.type === 'checkboxes') {
      return html`
        <fieldset class="mb-4">
          <legend class=${ui.label}>${f.label}</legend>
          <div class="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            ${Object.entries(f.options ?? {}).map(([v, l]) => html`
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="${f.key}" value="${v}" ?disabled=${dis}
                       class="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />${l}
              </label>`)}
            ${Object.keys(f.options ?? {}).length ? '' : html`<span class="text-sm text-slate-400">${I18n.t('common.no_options')}</span>`}
          </div>
        </fieldset>`;
    }
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
          ? html`<textarea id="${f.key}" name="${f.key}" rows="${f.rows ?? 4}" placeholder=${f.placeholder ?? ''} spellcheck=${f.mono ? 'false' : 'true'} wrap=${f.mono ? 'off' : 'soft'}
                           class="${cls} ${f.mono ? 'font-mono text-[13px] leading-5 whitespace-pre overflow-x-auto' : ''}" ?disabled=${dis}></textarea>
                 ${f.mono ? html`<code-editor for=${f.key} language=${f.language ?? 'html'} rows=${f.rows ?? 12}></code-editor>` : ''}`
          : f.type === 'select'
          ? html`<select id="${f.key}" name="${f.key}" class=${cls} ?disabled=${dis}>
              <option value="">${I18n.t('common.select')}</option>
              ${Object.entries(f.options ?? {}).map(([v, l]) => html`<option value="${v}">${l}</option>`)}
            </select>`
          : html`<input id="${f.key}" name="${f.key}" type="${f.type ?? 'text'}" placeholder=${f.placeholder ?? ''} class=${cls} ?disabled=${dis} />`}
        ${f.help ? html`<p class="mt-1 text-xs text-slate-500">${f.help}</p>` : ''}
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
      <form class="${ui.card} p-6 md:p-8" @submit="${this._handleSubmit.bind(this)}">
        <h3 class="mb-5 text-base font-semibold text-slate-900">${I18n.t(this.mode === 'add' ? 'crud.new_record' : 'crud.edit_record')}</h3>
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
          <button type="button" class=${btn('secondary')} @click=${() => this.dispatchEvent(new CustomEvent('form-cancel', { bubbles: true }))}>${I18n.t('common.cancel')}</button>
          <button type="submit" class=${btn('primary')} ?disabled="${this.saving}">${this.saving ? I18n.t('common.saving') : I18n.t('common.save')}</button>
        </div>
      </form>`;
  }
}
