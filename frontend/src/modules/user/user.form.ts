import { customElement, state } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { I18n } from '../../lib/i18n';
import { UserService, UserDTO } from './user.service';

@customElement('user-form')
export class UserForm extends CrudForm<UserDTO> {
  get prefix() { return 'user'; }
  service = new UserService();
  @state() private profileOptions: Record<string, string> = {};

  async connectedCallback() {
    super.connectedCallback();
    const profiles = await this.service.profiles();
    this.profileOptions = Object.fromEntries(profiles.map(p => [String(p.id), p.name]));
    // The options arrive after the first render: re-apply the values of an edit in progress.
    await this.updateComplete;
    this.repopulate();
  }

  fields = (): FormField[] => [
    { key: 'login', label: I18n.t('user.field.login'), required: true, disabled: this.mode === 'edit', zone: 'left' },
    { key: 'name', label: I18n.t('user.field.name'), required: true, zone: 'right' },
    { key: 'email', label: I18n.t('user.field.email'), type: 'email', zone: 'left' },
    {
      key: 'password', label: I18n.t(this.mode === 'add' ? 'user.field.password' : 'user.field.new_password'),
      type: 'password', required: this.mode === 'add', zone: 'right',
      validator: v => !v || String(v).length >= 6,
    },
    { key: 'profile_ids', label: I18n.t('user.field.profiles'), type: 'checkboxes', options: this.profileOptions, zone: 'bottom' },
  ];
}
