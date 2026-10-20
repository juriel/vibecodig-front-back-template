import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { btn } from './ui';
import { icon } from './icons';
import { I18n } from './i18n';

/** Ephemeral notification. Usage: toast(I18n.t('crud.saved'), 'success'); toast(message, 'error', 5000) */
export function toast(message: string, kind: 'info' | 'success' | 'error' = 'info', ms = 3500) {
  const el = document.createElement('app-toast') as AppToast;
  el.message = message;
  el.kind = kind;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

const TOAST_COLORS = {
  info:    'border-slate-200 bg-white text-slate-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error:   'border-red-200 bg-red-50 text-red-800',
};

@customElement('app-toast')
export class AppToast extends LitElement {
  @property() message = '';
  @property() kind: 'info' | 'success' | 'error' = 'info';
  createRenderRoot() { return this; }
  render() {
    return html`
      <div class="fixed bottom-4 right-4 z-[10000] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${TOAST_COLORS[this.kind]}" role="status">
        <span class="flex-1">${this.message}</span>
        <button class="opacity-60 hover:opacity-100" @click=${() => this.remove()} aria-label="${I18n.t('common.close')}">${icon('x', 'size-4')}</button>
      </div>`;
  }
}

/** Promise-based confirmation dialog. Usage: if (await confirmDialog(I18n.t('crud.delete.title'), { danger: true })) ... */
export function confirmDialog(
  question: string,
  opts: { title?: string; okLabel?: string; cancelLabel?: string; danger?: boolean } = {},
): Promise<boolean> {
  return new Promise(resolve => {
    const el = document.createElement('app-confirm') as AppConfirm;
    Object.assign(el, opts, { question, resolve: (v: boolean) => { el.remove(); resolve(v); } });
    document.body.appendChild(el);
  });
}

@customElement('app-confirm')
export class AppConfirm extends LitElement {
  @property() title = I18n.t('common.confirm');
  @property() question = '';
  @property() okLabel = I18n.t('common.accept');
  @property() cancelLabel = I18n.t('common.cancel');
  @property({ type: Boolean }) danger = false;
  resolve: (v: boolean) => void = () => {};
  createRenderRoot() { return this; }
  render() {
    return html`
      <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" @click=${() => this.resolve(false)}>
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" @click=${(e: Event) => e.stopPropagation()}>
          <h3 class="text-base font-semibold text-slate-900">${this.title}</h3>
          <p class="mt-2 text-sm text-slate-600">${this.question}</p>
          <div class="mt-6 flex justify-end gap-2">
            <button class=${btn('secondary')} @click=${() => this.resolve(false)}>${this.cancelLabel}</button>
            <button class=${btn(this.danger ? 'danger' : 'primary')} @click=${() => this.resolve(true)}>${this.okLabel}</button>
          </div>
        </div>
      </div>`;
  }
}
