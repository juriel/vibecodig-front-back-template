import { customElement, state } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
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
    // Las opciones llegan después del primer render: re-aplicar los valores de una edición en curso.
    await this.updateComplete;
    this.repopulate();
  }

  fields = (): FormField[] => [
    { key: 'login', label: 'Usuario', required: true, disabled: this.mode === 'edit', zone: 'left' },
    { key: 'name', label: 'Nombre', required: true, zone: 'right' },
    { key: 'email', label: 'Correo', type: 'email', zone: 'left' },
    {
      key: 'password', label: this.mode === 'add' ? 'Contraseña' : 'Nueva contraseña (opcional)',
      type: 'password', required: this.mode === 'add', zone: 'right',
      validator: v => !v || String(v).length >= 6,
    },
    { key: 'profile_ids', label: 'Perfiles', type: 'checkboxes', options: this.profileOptions, zone: 'bottom' },
  ];
}
