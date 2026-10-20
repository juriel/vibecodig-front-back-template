import { customElement, state } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { I18n } from '../../lib/i18n';
import { CmsLayoutService, CmsLayoutDTO } from './cms-layout.service';

@customElement('cms-layout-form')
export class CmsLayoutForm extends CrudForm<CmsLayoutDTO> {
  get prefix() { return 'cms-layout'; }
  service = new CmsLayoutService();
  @state() private typeOptions: Record<string, string> = {};

  async connectedCallback() {
    super.connectedCallback();
    const types = await this.service.types();
    this.typeOptions = Object.fromEntries(types.map(t => [t.code, t.type_name]));
    await this.updateComplete;
    this.repopulate();
  }

  fields = (): FormField[] => [
    { key: 'layout_name', label: I18n.t('cms.layout.field.name'), required: true, zone: 'left' },
    { key: 'cms_type_layout', label: I18n.t('cms.layout.field.type'), type: 'select', options: this.typeOptions, required: true, zone: 'right' },
    { key: 'default_layout', label: I18n.t('cms.layout.field.default'), type: 'checkbox', zone: 'bottom' },
    { key: 'layout_content', label: I18n.t('cms.layout.field.content'), type: 'textarea', mono: true, rows: 18, zone: 'bottom',
      help: I18n.t('cms.layout.field.content_help') },
  ];
}
