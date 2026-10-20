import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { CrudTable } from '../../crud/crud-table';
import { PrivilegeDTO } from '../profile/profile.service';
import { I18n } from '../../lib/i18n';
import { PrivilegeService } from './privilege.service';

@customElement('privilege-table')
export class PrivilegeTable extends CrudTable<PrivilegeDTO> {
  get prefix() { return 'privilege'; }
  service = new PrivilegeService();
  canEdit = false;
  canDelete = false;
  pageSize = 15;
  columns = () => [
    { key: 'code', label: I18n.t('privilege.col.code'), renderer: (p: PrivilegeDTO) => html`<code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">${p.code}</code>` },
    { key: 'description', label: I18n.t('privilege.col.description') },
    { key: 'category', label: I18n.t('privilege.col.category') },
  ];
}
