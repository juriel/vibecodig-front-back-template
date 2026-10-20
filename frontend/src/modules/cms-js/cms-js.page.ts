import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { CmsAssetDTO } from '../cms-asset/cms-asset';
import { I18n } from '../../lib/i18n';
import { CmsJsTable } from './cms-js.table';
import { CmsJsForm } from './cms-js.form';

@customElement('cms-js-page')
export class CmsJsPage extends CrudPage<CmsAssetDTO> {
  get prefix() { return 'cms-js'; }
  get permission() { return 'cms-layout'; }   // global CSS/JS use the layout privileges
  label = I18n.t('menu.javascripts');
  createTable = () => new CmsJsTable();
  createForm  = () => new CmsJsForm();
}
