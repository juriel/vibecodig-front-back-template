import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { CrudTable } from '../../crud/crud-table';
import { I18n } from '../../lib/i18n';
import { UserService, UserDTO } from './user.service';

@customElement('user-table')
export class UserTable extends CrudTable<UserDTO> {
  get prefix() { return 'user'; }
  service = new UserService();
  columns = () => [
    { key: 'login', label: I18n.t('user.field.login') },
    { key: 'name', label: I18n.t('user.field.name') },
    { key: 'email', label: I18n.t('user.field.email') },
    {
      key: 'profiles', label: I18n.t('user.field.profiles'),
      renderer: (u: UserDTO) => html`${(u.profiles ?? []).map(p => html`
        <span class="mr-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">${p.name}</span>
        ${p.super ? html`<span class="mr-1 inline-block rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700" title=${I18n.t('user.super_help')}>${I18n.t('user.super')}</span>` : ''}`)}`,
    },
  ];
}
