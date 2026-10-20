import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { CrudTable } from '../../crud/crud-table';
import { I18n } from '../../lib/i18n';
import { CmsWidgetService, CmsWidgetDTO } from './cms-widget.service';

@customElement('cms-widget-table')
export class CmsWidgetTable extends CrudTable<CmsWidgetDTO> {
  get prefix() { return 'cms-widget'; }
  get permission() { return 'cms-page'; }     // widgets have no privileges of their own: they use the page ones
  service = new CmsWidgetService();
  columns = () => [
    { key: 'name', label: I18n.t('cms.widget.col.widget'), renderer: (w: CmsWidgetDTO) => html`<code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">%WIDGET:${w.name}%</code>` },
    { key: 'used_in_layouts', label: I18n.t('cms.widget.col.in_layouts'), renderer: (w: CmsWidgetDTO) => String(w.used_in_layouts ?? 0) },
    { key: 'used_in_pages', label: I18n.t('cms.widget.col.in_pages'), renderer: (w: CmsWidgetDTO) => String(w.used_in_pages ?? 0) },
  ];
}
