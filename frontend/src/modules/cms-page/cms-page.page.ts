import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { CmsPageTable } from './cms-page.table';
import { CmsPageForm } from './cms-page.form';
import { I18n } from '../../lib/i18n';
import { CmsPageDTO } from './cms-page.service';

@customElement('cms-page-page')
export class CmsPagePage extends CrudPage<CmsPageDTO> {
  get prefix() { return 'cms-page'; }
  label = I18n.t('menu.pages');
  createTable = () => new CmsPageTable();
  createForm  = () => new CmsPageForm();
}
