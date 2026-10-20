import { customElement } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { PrivilegeDTO } from '../profile/profile.service';
import { PrivilegeService } from './privilege.service';

/** Required by CrudPage; unused because the catalog is read-only. */
@customElement('privilege-form')
export class PrivilegeForm extends CrudForm<PrivilegeDTO> {
  get prefix() { return 'privilege'; }
  service = new PrivilegeService();
  fields = (): FormField[] => [];
}
