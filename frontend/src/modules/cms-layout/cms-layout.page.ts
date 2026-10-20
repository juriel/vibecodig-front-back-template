import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { CmsLayoutTable } from './cms-layout.table';
import { CmsLayoutForm } from './cms-layout.form';
import { I18n } from '../../lib/i18n';
import { CmsLayoutDTO } from './cms-layout.service';

@customElement('cms-layout-page')
export class CmsLayoutPage extends CrudPage<CmsLayoutDTO> {
  get prefix() { return 'cms-layout'; }
  label = I18n.t('menu.layouts');
  createTable = () => new CmsLayoutTable();
  createForm  = () => new CmsLayoutForm();
}
