import { customElement } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { I18n } from '../../lib/i18n';
import { CmsRedirectService, CmsRedirectDTO } from './cms-redirect.service';

@customElement('cms-redirect-form')
export class CmsRedirectForm extends CrudForm<CmsRedirectDTO> {
  get prefix() { return 'cms-redirect'; }
  service = new CmsRedirectService();
  fields = (): FormField[] => [
    { key: 'source', label: I18n.t('cms.redirect.field.source'), required: true, zone: 'left', placeholder: '/servicios.html',
      help: I18n.t('cms.redirect.field.source_help') },
    { key: 'target', label: I18n.t('cms.redirect.field.target'), required: true, zone: 'right', placeholder: '/servicios.page',
      help: I18n.t('cms.redirect.field.target_help') },
    { key: 'status_code', label: I18n.t('cms.redirect.field.type'), type: 'select', zone: 'left', default: '301',
      options: { '301': I18n.t('cms.redirect.type.301'), '302': I18n.t('cms.redirect.type.302') } },
    { key: 'active', label: I18n.t('cms.redirect.field.active'), type: 'checkbox', zone: 'right', default: true },
  ];
}
