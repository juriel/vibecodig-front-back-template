import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { CrudTable } from '../../crud/crud-table';
import { I18n } from '../../lib/i18n';
import { CmsRedirectService, CmsRedirectDTO } from './cms-redirect.service';

@customElement('cms-redirect-table')
export class CmsRedirectTable extends CrudTable<CmsRedirectDTO> {
  get prefix() { return 'cms-redirect'; }
  get permission() { return 'cms-page'; }     // redirects have no privileges of their own: they use the page ones
  service = new CmsRedirectService();
  columns = () => [
    { key: 'source', label: I18n.t('cms.redirect.col.source'), renderer: (r: CmsRedirectDTO) => html`<code class="text-xs">${r.source}</code>` },
    { key: 'target', label: I18n.t('cms.redirect.col.target'), slice: 60 },
    { key: 'status_code', label: I18n.t('cms.redirect.col.type'), renderer: (r: CmsRedirectDTO) => I18n.t(`cms.redirect.type.${r.status_code}`) },
    { key: 'active', label: I18n.t('cms.redirect.col.active'), renderer: (r: CmsRedirectDTO) => I18n.t(r.active ? 'common.yes' : 'common.no') },
  ];
}
