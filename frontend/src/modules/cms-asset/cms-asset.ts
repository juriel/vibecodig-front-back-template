/**
 * Shared pieces of the global CSS and JS administration (they work the same way):
 * an asset is EXTERNAL (`url`) or OWN (`path` + `content`, served at /css/<path> or /js/<path>).
 */
import { html } from 'lit';
import { CrudService } from '../../crud/crud-service';
import { CrudTable } from '../../crud/crud-table';
import { CrudForm } from '../../crud/crud-form';
import { FormField } from '../../crud/types';
import { GlobalConfig } from '../../global-config';
import { I18n } from '../../lib/i18n';
import { toast } from '../../lib/toast';

export type AssetKind = 'css' | 'js';

export interface CmsAssetDTO {
  code: string;
  name: string;
  active?: boolean;
  order_show?: number | string;
  url?: string;
  path?: string;
  content?: string;
  type?: 'header' | 'footer';       // JS only
  // read-only (list)
  source?: 'external' | 'own';
  content_length?: number;
}

export class CmsAssetService extends CrudService<CmsAssetDTO> {
  base: string;
  constructor(kind: AssetKind) {
    super();
    this.base = GlobalConfig.getInstance().apiUrl + 'cms/' + kind;
  }
  getKey = (e: CmsAssetDTO) => e.code;
}

const badge = (text: string, tone: string) =>
  html`<span class="rounded-full px-2 py-0.5 text-xs font-medium ${tone}">${text}</span>`;

export abstract class CmsAssetTable extends CrudTable<CmsAssetDTO> {
  abstract kind: AssetKind;
  // Global CSS/JS have no privileges of their own: they use the layout ones.
  get permission() { return 'cms-layout'; }

  columns = () => [
    { key: 'code', label: I18n.t('cms.asset.col.code'), renderer: (a: CmsAssetDTO) => html`<code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">${a.code}</code>` },
    { key: 'name', label: I18n.t('cms.asset.col.name') },
    {
      key: 'source', label: I18n.t('cms.asset.col.source'),
      renderer: (a: CmsAssetDTO) => a.source === 'external'
        ? html`${badge(I18n.t('cms.asset.external'), 'bg-sky-50 text-sky-700')} <span class="ml-1 text-xs text-slate-500" title=${a.url!}>${(a.url ?? '').replace(/^https?:\/\//, '').slice(0, 40)}</span>`
        : html`${badge(I18n.t('cms.asset.own'), 'bg-slate-100 text-slate-600')} <a class="ml-1 text-xs text-brand-600 hover:underline" target="_blank" rel="noopener" href=${`/${this.kind}/${a.path}`}>/${this.kind}/${a.path}</a>`,
    },
    ...(this.kind === 'js' ? [{ key: 'type', label: I18n.t('cms.asset.col.type'), renderer: (a: CmsAssetDTO) => badge(I18n.t('cms.js.type.' + a.type), 'bg-slate-100 text-slate-600') }] : []),
    { key: 'order_show', label: I18n.t('cms.asset.col.order'), renderer: (a: CmsAssetDTO) => String(a.order_show ?? 0) },
    { key: 'active', label: I18n.t('cms.asset.col.active'), renderer: (a: CmsAssetDTO) => a.active ? badge(I18n.t('common.yes'), 'bg-emerald-50 text-emerald-700') : badge(I18n.t('common.no'), 'bg-slate-100 text-slate-500') },
  ];
}

export abstract class CmsAssetForm extends CrudForm<CmsAssetDTO> {
  abstract kind: AssetKind;

  /** The list does not include the content: the full detail is fetched before editing. */
  async load(element: CmsAssetDTO) {
    this.mode = 'edit';
    try {
      super.load(await this.service.findById(this.service.getKey(element)));
    } catch {
      toast(I18n.t('cms.asset.load_error'), 'error');
    }
  }

  fields = (): FormField[] => {
    const ext = '.' + this.kind;
    return [
      { key: 'code', label: I18n.t('cms.asset.field.code'), required: true, disabled: this.mode === 'edit', zone: 'left', help: I18n.t('cms.asset.field.code_help'),
        validator: v => /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(String(v)) && String(v).length <= 32 },
      { key: 'name', label: I18n.t('cms.asset.field.name'), required: true, zone: 'right' },
      { key: 'order_show', label: I18n.t('cms.asset.field.order'), type: 'number', default: 0, zone: 'left', help: I18n.t('cms.asset.field.order_help') },
      ...(this.kind === 'js'
        ? [{ key: 'type', label: I18n.t('cms.asset.field.type'), type: 'select' as const, required: true, default: 'footer', zone: 'right' as const,
             options: { header: I18n.t('cms.js.type.header'), footer: I18n.t('cms.js.type.footer') } }]
        : []),
      { key: 'active', label: I18n.t('cms.asset.field.active'), type: 'checkbox', default: true, zone: 'bottom' },
      { key: 'url', label: I18n.t('cms.asset.field.url'), placeholder: 'https://cdn.example.com/file' + ext, zone: 'bottom', help: I18n.t('cms.asset.field.url_help'),
        validator: v => !v || /^https?:\/\/\S+$/.test(String(v)) },
      { key: 'path', label: I18n.t('cms.asset.field.path'), placeholder: 'site' + ext, zone: 'bottom', help: I18n.t('cms.asset.field.path_help', `/${this.kind}/<path>`, ext),
        validator: v => !v || /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(String(v)) },
      { key: 'content', label: I18n.t('cms.asset.field.content'), type: 'textarea', mono: true, language: this.kind === 'css' ? 'css' : 'javascript', rows: 20, zone: 'bottom' },
    ];
  };
}

