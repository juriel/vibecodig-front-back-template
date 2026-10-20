import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { CrudTable } from '../../crud/crud-table';
import { I18n } from '../../lib/i18n';
import { CmsPageService, CmsPageDTO } from './cms-page.service';

@customElement('cms-page-table')
export class CmsPageTable extends CrudTable<CmsPageDTO> {
  get prefix() { return 'cms-page'; }
  service = new CmsPageService();
  columns = () => [
    {
      key: 'url', label: 'URL',
      renderer: (p: CmsPageDTO) => html`<a class="font-medium text-brand-600 hover:underline" target="_blank" rel="noopener"
        href=${p.is_index ? '/' : `/${p.url}.page`} title="${I18n.t('cms.page.open')}">/${p.url}.page</a>
        ${p.is_index ? html`<span class="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">${I18n.t('cms.page.home_badge')}</span>` : ''}`,
    },
    { key: 'title', label: I18n.t('cms.page.col.title'), slice: 60 },
    { key: 'layout_name', label: I18n.t('cms.page.col.layout') },
    { key: 'owner_name', label: I18n.t('cms.page.col.owner') },
    { key: 'last_update_date', label: I18n.t('cms.page.col.updated'), renderer: (p: CmsPageDTO) => (p.last_update_date ?? '').replace('T', ' ').slice(0, 16) },
  ];
}
