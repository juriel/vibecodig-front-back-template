import { customElement, state } from 'lit/decorators.js';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { I18n } from '../../lib/i18n';
import { ProfileService, ProfileDTO } from './profile.service';

@customElement('profile-form')
export class ProfileForm extends CrudForm<ProfileDTO> {
  get prefix() { return 'profile'; }
  service = new ProfileService();
  @state() private groups: Record<string, Record<string, string>> = {};

  async connectedCallback() {
    super.connectedCallback();
    const privileges = await this.service.privileges();
    const groups: Record<string, Record<string, string>> = {};
    for (const p of privileges) (groups[p.category] ??= {})[p.code] = p.description || p.code;
    this.groups = groups;
    // The options arrive after the first render: re-apply the values of an edit in progress.
    await this.updateComplete;
    this.repopulate();
  }

  fields = (): FormField[] => [
    { key: 'name', label: I18n.t('profile.field.name'), required: true },
    { key: 'privilege_codes', label: I18n.t('profile.field.privileges'), type: 'checkboxes', groups: this.groups, zone: 'bottom' },
  ];
}
