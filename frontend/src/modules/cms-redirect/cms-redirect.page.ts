import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { CmsRedirectTable } from './cms-redirect.table';
import { CmsRedirectForm } from './cms-redirect.form';
import { I18n } from '../../lib/i18n';
import { CmsRedirectDTO } from './cms-redirect.service';

@customElement('cms-redirect-page')
export class CmsRedirectPage extends CrudPage<CmsRedirectDTO> {
  get prefix() { return 'cms-redirect'; }
  get permission() { return 'cms-page'; }   // redirects use the page privileges
  label = I18n.t('menu.redirects');
  createTable = () => new CmsRedirectTable();
  createForm  = () => new CmsRedirectForm();
}
