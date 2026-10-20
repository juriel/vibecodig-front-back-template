import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { CrudTable } from '../../crud/crud-table';
import { UserService, UserDTO } from './user.service';

@customElement('user-table')
export class UserTable extends CrudTable<UserDTO> {
  get prefix() { return 'user'; }
  service = new UserService();
  columns = () => [
    { key: 'login', label: 'Usuario' },
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo' },
    {
      key: 'profiles', label: 'Perfiles',
      renderer: (u: UserDTO) => html`${(u.profiles ?? []).map(p =>
        html`<span class="mr-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">${p.name}</span>`)}`,
    },
  ];
}
