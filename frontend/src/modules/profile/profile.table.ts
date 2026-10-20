import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { CrudTable } from '../../crud/crud-table';
import { SessionStatus } from '../../lib/session';
import { I18n } from '../../lib/i18n';
import { ProfileService, ProfileDTO } from './profile.service';

const badge = (text: string, tone: string) =>
  html`<span class="mr-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone}">${text}</span>`;

@customElement('profile-table')
export class ProfileTable extends CrudTable<ProfileDTO> {
  get prefix() { return 'profile'; }
  service = new ProfileService();

  private isSuper = (p: ProfileDTO) => !!p.privilege_codes?.includes('ALL');
  // System profiles are never touched; super user profiles are only managed by another super user.
  canEditRow = (p: ProfileDTO) => !!p.editable && (!this.isSuper(p) || SessionStatus.getInstance().can('ALL'));
  canDeleteRow = (p: ProfileDTO) => this.canEditRow(p);

  columns = () => [
    { key: 'name', label: I18n.t('profile.col.profile') },
    {
      key: 'editable', label: I18n.t('profile.col.type'),
      renderer: (p: ProfileDTO) => p.editable ? badge(I18n.t('profile.type.custom'), 'bg-slate-100 text-slate-600') : badge(I18n.t('profile.type.system'), 'bg-amber-50 text-amber-700'),
    },
    {
      key: 'privilege_codes', label: I18n.t('profile.col.privileges'),
      renderer: (p: ProfileDTO) => this.isSuper(p)
        ? badge(I18n.t('profile.super'), 'bg-brand-50 text-brand-700')
        : badge(I18n.tn('profile.privilege_count', p.privilege_codes?.length ?? 0), 'bg-brand-50 text-brand-700'),
    },
  ];
}
