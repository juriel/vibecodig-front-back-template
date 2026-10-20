import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { UserTable } from './user.table';
import { UserForm } from './user.form';
import { I18n } from '../../lib/i18n';
import { UserDTO } from './user.service';

@customElement('user-page')
export class UserPage extends CrudPage<UserDTO> {
  get prefix() { return 'user'; }
  label = I18n.t('menu.users');
  createTable = () => new UserTable();
  createForm  = () => new UserForm();
}
