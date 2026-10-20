import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { MessageBroker } from './broker';
import { CrudService } from './crud-service';
import { FormField } from './types';

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
    return html`
      <div class="form-group">
        <label for="${f.key}">${f.label}${f.required ? html`<span class="required">*</span>` : ''}</label>
        ${f.type === 'textarea'
          ? html`<textarea id="${f.key}" name="${f.key}" ?disabled="${f.disabled || this.saving}"></textarea>`
          : f.type === 'select'
          ? html`<select id="${f.key}" name="${f.key}" ?disabled="${f.disabled || this.saving}">
              <option value="">-- Seleccionar --</option>
              ${Object.entries(f.options ?? {}).map(([v, l]) => html`<option value="${v}">${l}</option>`)}
            </select>`
          : html`<input id="${f.key}" name="${f.key}" type="${f.type ?? 'text'}" ?disabled="${f.disabled || this.saving}" />`}
        ${err ? html`<span class="error">${err}</span>` : ''}
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
      <form @submit="${this._handleSubmit.bind(this)}">
        ${this.errors['_global'] ? html`<p class="error-global">${this.errors['_global']}</p>` : ''}
        <div class="form-zone-top">${top.map(f => this._renderField(f))}</div>
        ${hasLR ? html`
          <div class="form-zone-columns">
            <div class="form-zone-left">${left.map(f => this._renderField(f))}</div>
            <div class="form-zone-right">${right.map(f => this._renderField(f))}</div>
          </div>` : ''}
        <div class="form-zone-bottom">${bottom.map(f => this._renderField(f))}</div>
        <button type="submit" ?disabled="${this.saving}">${this.saving ? 'Guardando...' : 'Guardar'}</button>
      </form>`;
  }
}
