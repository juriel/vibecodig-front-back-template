import { customElement } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { ProfileTable } from './profile.table';
import { ProfileForm } from './profile.form';
import { I18n } from '../../lib/i18n';
import { ProfileDTO } from './profile.service';

@customElement('profile-page')
export class ProfilePage extends CrudPage<ProfileDTO> {
  get prefix() { return 'profile'; }
  label = I18n.t('menu.profiles');
  createTable = () => new ProfileTable();
  createForm  = () => new ProfileForm();
}
