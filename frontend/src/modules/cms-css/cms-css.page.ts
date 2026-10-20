import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { CmsAssetDTO } from '../cms-asset/cms-asset';
import { I18n } from '../../lib/i18n';
import { CmsCssTable } from './cms-css.table';
import { CmsCssForm } from './cms-css.form';

@customElement('cms-css-page')
export class CmsCssPage extends CrudPage<CmsAssetDTO> {
  get prefix() { return 'cms-css'; }
  get permission() { return 'cms-layout'; }   // global CSS/JS use the layout privileges
  label = I18n.t('menu.css');
  createTable = () => new CmsCssTable();
  createForm  = () => new CmsCssForm();
}
