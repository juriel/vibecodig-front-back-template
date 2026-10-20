import { customElement, state } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { toast } from '../../lib/toast';
import { I18n } from '../../lib/i18n';
import { CmsPageService, CmsPageDTO } from './cms-page.service';

@customElement('cms-page-form')
export class CmsPageForm extends CrudForm<CmsPageDTO> {
  get prefix() { return 'cms-page'; }
  service = new CmsPageService();
  @state() private layoutOptions: Record<string, string> = {};

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

  fields = (): FormField[] => [
    { key: 'url', label: I18n.t('cms.page.field.url'), required: true, zone: 'left', placeholder: 'my-page', help: I18n.t('cms.page.field.url_help') },
    { key: 'cms_layout', label: I18n.t('cms.page.field.layout'), type: 'select', options: this.layoutOptions, required: true, zone: 'right' },
    { key: 'title', label: I18n.t('cms.page.field.title'), required: true, zone: 'left' },
    { key: 'subtitle', label: I18n.t('cms.page.field.subtitle'), zone: 'right' },
    { key: 'keywords', label: I18n.t('cms.page.field.keywords'), zone: 'bottom' },
    { key: 'is_index', label: I18n.t('cms.page.field.is_index'), type: 'checkbox', zone: 'bottom' },
    { key: 'page_content', label: I18n.t('cms.page.field.content'), type: 'textarea', mono: true, rows: 16, zone: 'bottom',
      help: I18n.t('cms.page.field.content_help') },
    { key: 'css', label: I18n.t('cms.page.field.css'), type: 'textarea', mono: true, rows: 6, zone: 'bottom', help: I18n.t('cms.page.field.css_help') },
    { key: 'javascript', label: I18n.t('cms.page.field.js'), type: 'textarea', mono: true, rows: 6, zone: 'bottom', help: I18n.t('cms.page.field.js_help') },
  ];
}
