import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import axios from 'axios';
import { GlobalConfig } from '../../global-config';
import { I18n } from '../../lib/i18n';
import { ui, btn } from '../../lib/ui';
import { icon } from '../../lib/icons';
import { CmsPageService, CmsPageDTO } from './cms-page.service';

/**
 * "Create with AI": the person describes the page in plain words, the assistant writes a draft with the site's own
 * layout, classes and widgets, and it is saved hidden from search engines (noindex) for review. Emits `draft-created`.
 */
@customElement('ai-draft-dialog')
export class AiDraftDialog extends LitElement {
  @state() private enabled: boolean | null = null;
  @state() private layouts: { id: number; layout_name: string }[] = [];
  @state() private busy = false;
  @state() private error = '';
  private api = GlobalConfig.getInstance().apiUrl;

  createRenderRoot() { return this; }

  async connectedCallback() {
    super.connectedCallback();
    const [status, layouts] = await Promise.all([
      axios.get(this.api + 'ai/status').then(r => r.data).catch(() => ({ enabled: false })),
      new CmsPageService().layouts().catch(() => []),
    ]);
    this.enabled = !!status.enabled;
    this.layouts = layouts;
    this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>('#ai-brief')?.focus());
  }

  private close() { this.dispatchEvent(new CustomEvent('dialog-close', { bubbles: true })); }

  private async submit(e: SubmitEvent) {
    e.preventDefault();
    const f = new FormData(e.target as HTMLFormElement);
    const brief = String(f.get('brief')).trim();
    if (brief.length < 10) { this.error = I18n.t('ai.brief_short'); return; }
    this.busy = true; this.error = '';
    try {
      const layout = String(f.get('cms_layout') || '');
      const { data } = await axios.post<CmsPageDTO>(this.api + 'ai/draft-page', { brief, cms_layout: layout ? Number(layout) : null });
      this.dispatchEvent(new CustomEvent('draft-created', { detail: data, bubbles: true }));
    } catch (err: any) {
      const d = err.response?.data?.detail;
      this.error = typeof d === 'string' ? d : I18n.t('ai.draft_error');
    } finally {
      this.busy = false;
    }
  }

  render() {
    return html`
      <div class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" @click=${() => !this.busy && this.close()}>
        <form class="w-full max-w-2xl rounded-[24px] border border-slate-200 bg-surface p-7 shadow-2xl shadow-black/40" role="dialog" aria-modal="true"
              aria-labelledby="ai-title" @click=${(e: Event) => e.stopPropagation()} @submit=${this.submit}>
          <div class="flex items-start gap-4">
            <span class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">${icon('sparkles', 'size-7')}</span>
            <div>
              <h2 id="ai-title" class="font-display text-3xl font-semibold uppercase leading-none tracking-tight text-slate-900">${I18n.t('ai.title')}</h2>
              <p class="mt-2 text-[15px] text-slate-500">${I18n.t('ai.intro')}</p>
            </div>
          </div>

          ${this.enabled === false ? html`
            <p class="mt-6 rounded-xl border border-amber-700/30 bg-amber-700/10 px-4 py-3 text-sm text-amber-700" role="alert">${I18n.t('error.ai.not_configured')}</p>` : ''}
          ${this.error ? html`<p class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">${this.error}</p>` : ''}

          <label for="ai-brief" class="${ui.label} mt-6">${I18n.t('ai.brief')}</label>
          <textarea id="ai-brief" name="brief" rows="6" class=${ui.input} ?disabled=${this.busy || this.enabled === false}
                    placeholder=${I18n.t('ai.brief_placeholder')}></textarea>
          <p class="mt-1 text-xs text-slate-500">${I18n.t('ai.brief_help')}</p>

          <label for="ai-layout" class="${ui.label} mt-4">${I18n.t('cms.page.field.layout')}</label>
          <select id="ai-layout" name="cms_layout" class=${ui.input} ?disabled=${this.busy || this.enabled === false}>
            <option value="">${I18n.t('ai.default_layout')}</option>
            ${this.layouts.map(l => html`<option value=${l.id}>${l.layout_name}</option>`)}
          </select>

          <div class="mt-7 flex flex-wrap items-center justify-end gap-3">
            ${this.busy ? html`<span class="mr-auto flex items-center gap-2 text-sm text-slate-500">
              <span class="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-accent-500"></span>${I18n.t('ai.writing')}</span>` : ''}
            <button type="button" class=${btn('secondary')} ?disabled=${this.busy} @click=${this.close}>${I18n.t('common.cancel')}</button>
            <button type="submit" class="${ui.btn} bg-accent-500 text-on-accent shadow-sm hover:brightness-110 focus:ring-accent-500/30"
                    ?disabled=${this.busy || this.enabled !== true}>${icon('sparkles', 'size-4')}${I18n.t('ai.generate')}</button>
          </div>
        </form>
      </div>`;
  }
}
