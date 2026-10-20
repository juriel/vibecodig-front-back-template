import { customElement } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { I18n } from '../../lib/i18n';
import { CmsWidgetService, CmsWidgetDTO } from './cms-widget.service';

@customElement('cms-widget-form')
export class CmsWidgetForm extends CrudForm<CmsWidgetDTO> {
  get prefix() { return 'cms-widget'; }
  service = new CmsWidgetService();
  fields = (): FormField[] => [
    { key: 'name', label: I18n.t('cms.widget.field.name'), required: true, placeholder: 'header',
      help: I18n.t('cms.widget.field.name_help') },
    { key: 'value', label: I18n.t('cms.widget.field.content'), type: 'textarea', mono: true, rows: 18 },
  ];
}
