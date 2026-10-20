import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { PrivilegeTable } from './privilege.table';
import { PrivilegeForm } from './privilege.form';
import { PrivilegeDTO } from '../profile/profile.service';
import { I18n } from '../../lib/i18n';

@customElement('privilege-page')
export class PrivilegePage extends CrudPage<PrivilegeDTO> {
  get prefix() { return 'privilege'; }
  label = I18n.t('menu.privileges');
  canCreate = false;
  createTable = () => new PrivilegeTable();
  createForm  = () => new PrivilegeForm();
}
