import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { CmsWidgetTable } from './cms-widget.table';
import { CmsWidgetForm } from './cms-widget.form';
import { I18n } from '../../lib/i18n';
import { CmsWidgetDTO } from './cms-widget.service';

@customElement('cms-widget-page')
export class CmsWidgetPage extends CrudPage<CmsWidgetDTO> {
  get prefix() { return 'cms-widget'; }
  get permission() { return 'cms-page'; }   // widgets use the page privileges
  label = I18n.t('menu.widgets');
  createTable = () => new CmsWidgetTable();
  createForm  = () => new CmsWidgetForm();
}
