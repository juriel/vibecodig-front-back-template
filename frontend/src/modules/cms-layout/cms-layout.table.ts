import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { CrudTable } from '../../crud/crud-table';
import { I18n } from '../../lib/i18n';
import { CmsLayoutService, CmsLayoutDTO } from './cms-layout.service';

@customElement('cms-layout-table')
export class CmsLayoutTable extends CrudTable<CmsLayoutDTO> {
  get prefix() { return 'cms-layout'; }
  service = new CmsLayoutService();
  columns = () => [
    { key: 'layout_name', label: I18n.t('cms.layout.col.name') },
    { key: 'type_name', label: I18n.t('cms.layout.col.type') },
    {
      key: 'default_layout', label: I18n.t('cms.layout.col.default'),
      renderer: (l: CmsLayoutDTO) => l.default_layout ? html`<span class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">${I18n.t('common.yes')}</span>` : '',
    },
    { key: 'used_by', label: I18n.t('cms.layout.col.used_by'), renderer: (l: CmsLayoutDTO) => String(l.used_by ?? 0) },
  ];
}
