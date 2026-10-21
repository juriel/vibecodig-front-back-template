import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { toast } from '../../lib/toast';
import { I18n } from '../../lib/i18n';
import { ui } from '../../lib/ui';
import { icon } from '../../lib/icons';
import { CmsPageService, CmsPageDTO } from './cms-page.service';
import './page-visual-editor';

@customElement('cms-page-form')
export class CmsPageForm extends CrudForm<CmsPageDTO> {
  get prefix() { return 'cms-page'; }
  service = new CmsPageService();
  @state() private layoutOptions: Record<string, string> = {};
  @state() private visual: { content: string; css: string; title: string } | null = null;

  async connectedCallback() {
    super.connectedCallback();
    const layouts = await this.service.layouts();
    this.layoutOptions = Object.fromEntries(layouts.map(l => [String(l.id), l.layout_name]));
    await this.updateComplete;
    this.repopulate();      // the selector options arrive after the first render
  }

  /** The list does not include the content (HTML/CSS/JS): the full detail is fetched before editing. */
  async load(element: CmsPageDTO) {
    this.mode = 'edit';
    try {
      super.load(await this.service.findById(this.service.getKey(element)));
    } catch {
      toast(I18n.t('cms.page.load_error'), 'error');
    }
  }

  private _input(name: string) {
    return this.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  }

  /** Opens the visual editor with what the form holds right now (including unsaved edits). */
  private _openVisual() {
    this.visual = { content: this._input('page_content')?.value ?? '', css: this._input('css')?.value ?? '', title: this._input('title')?.value ?? '' };
  }

  /** The visual editor gives back HTML and CSS: they go into the same fields, saved with the form's "Save". */
  private _applyVisual(e: CustomEvent<{ content: string; css: string }>) {
    const content = this._input('page_content'), css = this._input('css');
    if (content) { content.value = e.detail.content; content.dispatchEvent(new Event('input', { bubbles: true })); }
    if (css) { css.value = e.detail.css; css.dispatchEvent(new Event('input', { bubbles: true })); }
    this.visual = null;
    toast(I18n.t('visual.applied'), 'success');
  }

  render() {
    return html`
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-accent-200 bg-accent-50 px-5 py-4">
        <p class="text-[15px] text-slate-700">${I18n.t('visual.form_hint')}</p>
        <button type="button" class="${ui.btn} bg-accent-500 text-on-accent shadow-sm hover:brightness-110 focus:ring-accent-500/30" @click=${this._openVisual}>${icon('palette', 'size-4')}${I18n.t('visual.open')}</button>
      </div>
      ${super.render()}
      ${this.visual ? html`<page-visual-editor .content=${this.visual.content} .css=${this.visual.css} .pageTitle=${this.visual.title}
          @visual-apply=${this._applyVisual} @visual-close=${() => { this.visual = null; }}></page-visual-editor>` : ''}`;
  }

  fields = (): FormField[] => [
    { key: 'url', label: I18n.t('cms.page.field.url'), required: true, zone: 'left', placeholder: 'my-page', help: I18n.t('cms.page.field.url_help') },
    { key: 'cms_layout', label: I18n.t('cms.page.field.layout'), type: 'select', options: this.layoutOptions, required: true, zone: 'right' },
    { key: 'title', label: I18n.t('cms.page.field.title'), required: true, zone: 'left' },
    { key: 'subtitle', label: I18n.t('cms.page.field.subtitle'), zone: 'right' },
    { key: 'keywords', label: I18n.t('cms.page.field.keywords'), zone: 'bottom' },
    { key: 'is_index', label: I18n.t('cms.page.field.is_index'), type: 'checkbox', zone: 'bottom' },
    { key: 'description', label: I18n.t('cms.page.field.description'), type: 'textarea', rows: 2, zone: 'bottom',
      help: I18n.t('cms.page.field.description_help') },
    { key: 'og_title', label: I18n.t('cms.page.field.og_title'), zone: 'left', help: I18n.t('cms.page.field.og_title_help') },
    { key: 'og_image', label: I18n.t('cms.page.field.og_image'), zone: 'right', placeholder: '/media/folder/image.png',
      help: I18n.t('cms.page.field.og_image_help') },
    { key: 'og_description', label: I18n.t('cms.page.field.og_description'), type: 'textarea', rows: 2, zone: 'bottom',
      help: I18n.t('cms.page.field.og_description_help') },
    { key: 'canonical', label: I18n.t('cms.page.field.canonical'), zone: 'bottom', placeholder: 'https://',
      help: I18n.t('cms.page.field.canonical_help') },
    { key: 'noindex', label: I18n.t('cms.page.field.noindex'), type: 'checkbox', zone: 'bottom' },
    { key: 'page_content', label: I18n.t('cms.page.field.content'), type: 'textarea', mono: true, rows: 16, zone: 'bottom',
      help: I18n.t('cms.page.field.content_help') },
    { key: 'css', label: I18n.t('cms.page.field.css'), type: 'textarea', mono: true, language: 'css', rows: 6, zone: 'bottom', help: I18n.t('cms.page.field.css_help') },
    { key: 'javascript', label: I18n.t('cms.page.field.js'), type: 'textarea', mono: true, language: 'javascript', rows: 6, zone: 'bottom', help: I18n.t('cms.page.field.js_help') },
  ];
}
