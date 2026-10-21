import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import axios from 'axios';
import type { Block, Component, Editor } from 'grapesjs';
import { GlobalConfig } from '../../global-config';
import { I18n } from '../../lib/i18n';
import { btn } from '../../lib/ui';
import { icon } from '../../lib/icons';
import { toast } from '../../lib/toast';
import './quick-style-panel';

/**
 * Full-screen visual editor (GrapesJS) for a page's HTML + CSS.
 * The page keeps being stored as HTML and CSS: this only edits them visually. It receives `content` and `css`
 * and, on "Apply", emits `visual-apply` with `{ content, css }` for the page form to write back into its fields.
 */
@customElement('page-visual-editor')
export class PageVisualEditor extends LitElement {
  @property() content = '';
  @property() css = '';
  @property() pageTitle = '';
  @state() private device: 'desktop' | 'mobile' = 'desktop';
  @state() private tab: 'blocks' | 'styles' | 'layers' = 'blocks';
  @state() private loading = true;
  @state() private selectedKind: 'image' | 'link' | 'other' | null = null;
  @state() private selected?: Component;
  @state() private uploading = false;
  private editor?: Editor;
  private api = GlobalConfig.getInstance().apiUrl;

  createRenderRoot() { return this; }

  async firstUpdated() {
    try {
      const [{ default: grapesjs }, { default: es }, assets, media] = await Promise.all([
        import(/* webpackChunkName: "grapesjs" */ 'grapesjs'),
        import(/* webpackChunkName: "grapesjs" */ 'grapesjs/locale/es'),
        axios.get<{ styles: string[] }>(this.api + 'cms/pages/editor-assets').then(r => r.data),
        axios.get<MediaDTO[]>(this.api + 'cms/media').then(r => r.data).catch(() => [] as MediaDTO[]),
        import(/* webpackChunkName: "grapesjs" */ 'grapesjs/dist/css/grapes.min.css'),
      ]);
      this.editor = grapesjs.init({
        container: this.querySelector<HTMLElement>('.gjs-host')!,
        height: '100%',
        width: 'auto',
        storageManager: false,
        components: this.content,
        style: this.css,
        protectedCss: '',                       // the output only carries the page's own CSS
        canvas: { styles: assets.styles },      // the site's global CSS, so the page looks as published
        canvasCss: CANVAS_CSS.replace(/#2f6fe4/g, getComputedStyle(document.documentElement).getPropertyValue('--brand-base').trim() || '#2f6fe4'),
        parser: { optionsHtml: { allowScripts: true, allowUnsafeAttr: true } },   // keep JSON-LD and onclick="..."
        panels: { defaults: [] },
        // Blocks can be dragged into the page or simply clicked (inserted after the selected element).
        blockManager: { appendTo: this.querySelector<HTMLElement>('.vis-blocks')!, blocks: blocks(), appendOnClick: (block: Block) => this._addBlock(block) },
        traitManager: { appendTo: this.querySelector<HTMLElement>('.vis-traits')! },
        assetManager: {
          assets: media.filter(m => m.type === 'image').map(m => ({ src: m.src, name: m.name })),
          uploadFile: (ev: any) => this._uploadImages(ev),
          showUrlInput: true,
          multiUpload: false,
        },
        styleManager: { appendTo: this.querySelector<HTMLElement>('.vis-styles')!, sectors: sectors() },
        // Styles go to the selected element only (never to a shared class), so a change cannot spill over to other parts.
        selectorManager: { componentFirst: true },
        layerManager: { appendTo: this.querySelector<HTMLElement>('.vis-layers')! },
        deviceManager: {
          devices: [
            { id: 'desktop', name: I18n.t('visual.desktop'), width: '' },
            { id: 'mobile', name: I18n.t('visual.mobile'), width: '390px', widthMedia: '480px' },
          ],
        },
        i18n: { locale: I18n.lang, detectLocale: false, messages: messages(es) },
      });
      // Selecting something shows its settings and style options right away.
      this.editor.on('component:selected', (c: Component) => {
        if (c.getTrait('id')) c.removeTrait('id');      // an HTML id means nothing to a non-technical user
        this.selectedKind = c.is('image') ? 'image' : c.is('link') ? 'link' : 'other';
        this.selected = c;
        if (this.tab === 'blocks') this.tab = 'styles';
      });
      this.editor.on('component:deselected', () => {
        if (!this.editor?.getSelected()) { this.selectedKind = null; this.selected = undefined; }
      });
      // A block dropped by dragging gets the same follow-up as a clicked one (pick the image, the PDF...).
      this.editor.on('block:drag:stop', (comp: Component | undefined, block: Block) => { if (comp) this._afterInsert(comp, block); });
    } catch {
      toast(I18n.t('visual.load_error'), 'error');
      this._close();
    } finally {
      this.loading = false;
    }
  }

  disconnectedCallback() {
    this.editor?.destroy();
    super.disconnectedCallback();
  }

  /** Click on a block: it is inserted right after the selected element (or at the end of the page) and selected. */
  private _addBlock(block: Block) {
    const ed = this.editor;
    if (!ed) return;
    const sel = ed.getSelected();
    const parent = sel && sel !== ed.getWrapper() ? sel.parent() : undefined;
    const added = parent ? parent.append(block.getContent() as any, { at: sel!.index() + 1 }) : ed.getWrapper()!.append(block.getContent() as any);
    const comp = added[0];
    if (!comp) return;
    ed.select(comp);
    comp.getEl()?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this._afterInsert(comp, block);
  }

  private _afterInsert(comp: Component, block: Block) {
    if (block.getId() === 'image') this._pickImage(comp);
    else if (block.getId() === 'document') this._pickDocument(comp);
  }

  /** Image picker: upload from the computer or choose one already uploaded; a click picks it. */
  private _pickImage(comp: Component) {
    const am = this.editor!.Assets;
    this.imageTarget = comp;
    am.open({
      types: ['image'],
      select: (asset: any) => { comp.set('src', asset.getSrc()); am.close(); },
    });
  }
  private imageTarget?: Component;

  /** Custom upload (axios carries the session token): the new image is added to the list and, if an image is waiting for one, used right away. */
  private async _uploadImages(ev: any) {
    const files: File[] = Array.from(ev.dataTransfer ? ev.dataTransfer.files : ev.target.files);
    for (const file of files) {
      const media = await this._upload(file);
      if (!media) continue;
      this.editor!.Assets.add({ src: media.src, name: media.name }, { at: 0 } as any);
      if (this.imageTarget && media.type === 'image') {
        this.imageTarget.set('src', media.src);
        this.editor!.Assets.close();
      }
    }
  }

  private async _upload(file: File): Promise<MediaDTO | null> {
    const data = new FormData();
    data.append('file', file);
    this.uploading = true;
    try {
      const media = (await axios.post<MediaDTO>(this.api + 'cms/media', data)).data;
      toast(I18n.t('visual.uploaded', media.name), 'success');
      return media;
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast(typeof detail === 'string' ? detail : I18n.t('visual.upload_error'), 'error', 6000);
      return null;
    } finally {
      this.uploading = false;
    }
  }

  /** Asks for a PDF, uploads it and makes the link point to it (opens in a new tab). */
  private _pickDocument(comp: Component) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const media = await this._upload(file);
      if (!media) return;
      comp.addAttributes({ href: media.src, target: '_blank' });
      if (comp.get('type') !== 'link' || !comp.getInnerHTML().trim() || comp.getInnerHTML().includes(I18n.t('visual.block.document_text')))
        comp.components(`📄 ${file.name.replace(/\.pdf$/i, '')}`);
    };
    input.click();
  }

  private _setDevice(device: 'desktop' | 'mobile') {
    this.device = device;
    this.editor?.setDevice(device);
  }

  private async _apply() {
    if (!this.editor) return;
    // getHtml() wraps the content in <body ...>: only its inner HTML belongs to the page.
    const html = this.editor.getHtml().replace(/^\s*<body[^>]*>/i, '').replace(/<\/body>\s*$/i, '').trim();
    const css = this.editor.getCss({ avoidProtected: true }) ?? '';
    // GrapesJS returns everything on one line: indent it so the HTML/CSS fields stay readable.
    // Inline elements (links, spans, svg...) stay on their line, so no visible whitespace is added; <script> (JSON-LD) is left as is.
    const [{ html_beautify }, { css_beautify }] = await Promise.all([
      import(/* webpackChunkName: "beautify" */ 'js-beautify/js/lib/beautify-html.js'),
      import(/* webpackChunkName: "beautify" */ 'js-beautify/js/lib/beautify-css.js'),
    ]);
    const detail = {
      content: html_beautify(html, { indent_size: 2, wrap_line_length: 0, preserve_newlines: false, content_unformatted: ['pre', 'textarea', 'script'] }),
      css: css_beautify(css, { indent_size: 2 }),
    };
    this.dispatchEvent(new CustomEvent('visual-apply', { detail, bubbles: true }));
  }

  private _close() {
    this.dispatchEvent(new CustomEvent('visual-close', { bubbles: true }));
  }

  render() {
    const tabBtn = (id: typeof this.tab, label: string) => html`
      <button type="button" class="flex-1 border-b-2 px-3 py-2.5 text-sm font-medium ${this.tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}"
              @click=${() => { this.tab = id; }}>${label}</button>`;
    const devBtn = (id: typeof this.device, ico: string, label: string) => html`
      <button type="button" title=${label} class="rounded-md p-2 ${this.device === id ? 'bg-raised text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
              @click=${() => this._setDevice(id)}>${icon(ico, 'size-5')}</button>`;
    return html`
      <style>${PANEL_CSS}</style>
      <div class="fixed inset-0 z-50 flex flex-col bg-ink" role="dialog" aria-modal="true" aria-label=${I18n.t('visual.title')}>
        <header class="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-surface px-4 py-2.5">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-slate-500">${I18n.t('visual.title')}</p>
            <p class="truncate text-sm font-semibold text-slate-900">${this.pageTitle || I18n.t('visual.untitled')}</p>
          </div>
          <div class="flex gap-1 rounded-lg bg-slate-100 p-1">
            ${devBtn('desktop', 'desktop', I18n.t('visual.desktop'))}
            ${devBtn('mobile', 'phone', I18n.t('visual.mobile'))}
          </div>
          <div class="flex gap-1">
            <button type="button" class=${btn('secondary')} title=${I18n.t('visual.undo')} @click=${() => this.editor?.UndoManager.undo()}>${icon('undo', 'size-4')}</button>
            <button type="button" class=${btn('secondary')} title=${I18n.t('visual.redo')} @click=${() => this.editor?.UndoManager.redo()}>${icon('redo', 'size-4')}</button>
          </div>
          <button type="button" class=${btn('secondary')} @click=${this._close}>${I18n.t('common.cancel')}</button>
          <button type="button" class=${btn('primary')} ?disabled=${this.loading} @click=${this._apply}>${icon('check', 'size-4')}${I18n.t('visual.apply')}</button>
        </header>
        <div class="flex min-h-0 flex-1">
          <div class="relative min-w-0 flex-1">
            <div class="gjs-host h-full"></div>
            ${this.uploading ? html`<div class="absolute inset-x-0 top-0 z-10 bg-brand-500 py-1.5 text-center text-sm font-medium text-ink">${I18n.t('visual.uploading')}</div>` : ''}
            ${this.loading ? html`<div class="absolute inset-0 grid place-items-center bg-slate-100 text-sm text-slate-500">${I18n.t('visual.loading')}</div>` : ''}
          </div>
          <aside class="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-surface">
            <div class="flex border-b border-slate-200">
              ${tabBtn('blocks', I18n.t('visual.tab.blocks'))}
              ${tabBtn('styles', I18n.t('visual.tab.styles'))}
              ${tabBtn('layers', I18n.t('visual.tab.layers'))}
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <div ?hidden=${this.tab !== 'blocks'}>
                <p class="px-4 pt-4 text-xs text-slate-500">${I18n.t('visual.blocks_help')}</p>
                <div class="vis-blocks"></div>
              </div>
              <div ?hidden=${this.tab !== 'styles'}>
                ${this.selectedKind ? '' : html`<p class="px-4 pt-4 text-xs text-slate-500">${I18n.t('visual.styles_help')}</p>`}
                ${this.selectedKind === 'image' || this.selectedKind === 'link' ? html`
                  <div class="space-y-2 border-b border-slate-200 p-4">
                    <p class="text-sm font-semibold text-slate-800">${I18n.t('visual.settings')}</p>
                    ${this.selectedKind === 'image'
                      ? html`<button type="button" class="${btn('primary')} w-full" @click=${() => this._pickImage(this.editor!.getSelected()!)}>${icon('photo', 'size-4')}${I18n.t('visual.change_image')}</button>`
                      : html`<button type="button" class="${btn('secondary')} w-full" ?disabled=${this.uploading} @click=${() => this._pickDocument(this.editor!.getSelected()!)}>${icon('document', 'size-4')}${I18n.t('visual.link_pdf')}</button>`}
                    <p class="text-xs text-slate-500">${I18n.t(this.selectedKind === 'image' ? 'visual.image_help' : 'visual.link_help')}</p>
                  </div>` : ''}
                <div class="vis-traits" ?hidden=${!this.selectedKind || this.selectedKind === 'other'}></div>
                ${this.selected && this.editor ? html`<quick-style-panel .editor=${this.editor} .component=${this.selected}></quick-style-panel>` : ''}
                <details class="vis-more" ?hidden=${!this.selected}>
                  <summary class="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900">${I18n.t('visual.more_options')}</summary>
                  <div class="vis-styles"></div>
                </details>
              </div>
              <div class="vis-layers" ?hidden=${this.tab !== 'layers'}></div>
            </div>
          </aside>
        </div>
      </div>`;
  }
}

/** GrapesJS UI adapted to the panel: light theme, canvas filling its area, class tags hidden (a non-technical user does not need them). */
const PANEL_CSS = `
  page-visual-editor .gjs-cv-canvas { width: 100%; height: 100%; top: 0; background: var(--color-ink); }
  page-visual-editor .gjs-one-bg { background-color: var(--color-surface); }
  page-visual-editor .gjs-two-color { color: var(--color-slate-700); }
  page-visual-editor .gjs-three-bg { background-color: var(--color-brand-500); color: var(--color-on-primary); }
  page-visual-editor .gjs-four-color, page-visual-editor .gjs-four-color-h:hover { color: var(--color-brand-500); }
  page-visual-editor .gjs-clm-tags { display: none; }
  page-visual-editor .gjs-sm-sector-title { background: var(--color-surface); border-bottom: 1px solid var(--color-slate-200); padding: 12px 16px; font-size: 13px; }
  page-visual-editor .gjs-sm-sector, page-visual-editor .gjs-sm-properties { border-color: var(--color-slate-200); }
  page-visual-editor .gjs-field { background: var(--color-raised); border: 1px solid var(--color-slate-300); border-radius: 10px; color: var(--color-slate-900); }
  page-visual-editor .gjs-field input, page-visual-editor .gjs-field select { color: var(--color-slate-900); }
  page-visual-editor .gjs-sm-label, page-visual-editor .gjs-label, page-visual-editor .gjs-trt-trait__label { color: var(--color-slate-600); }
  page-visual-editor .gjs-layer { background: var(--color-surface); color: var(--color-slate-700); }
  page-visual-editor .gjs-layer.gjs-selected .gjs-layer-item { background: var(--color-brand-100); }
  page-visual-editor .gjs-trt-traits { padding: 8px 6px; }
  page-visual-editor .gjs-blocks-c { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 4px 12px 12px; }
  page-visual-editor .gjs-block { width: auto; min-height: 80px; margin: 0; padding: 10px 6px; border: 1px solid var(--color-slate-200); border-radius: 16px; box-shadow: none;
    background: var(--color-raised); color: var(--color-slate-700); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; user-select: none; }
  page-visual-editor .gjs-block:hover { border-color: var(--color-brand-500); color: var(--color-slate-900); }
  page-visual-editor .gjs-block svg { fill: none; }
  page-visual-editor .gjs-block-label { font-size: 13px; font-weight: 500; }
  page-visual-editor .gjs-block-category .gjs-title { background: var(--color-surface); border-bottom: 1px solid var(--color-slate-200); font-size: 13px; color: var(--color-slate-600); }
  page-visual-editor .gjs-mdl-dialog { max-width: 900px; border-radius: 24px; overflow: hidden; border: 1px solid var(--color-slate-200); background: var(--color-surface); }
  page-visual-editor .gjs-mdl-header { background: var(--color-surface); color: var(--color-slate-900); border-bottom: 1px solid var(--color-slate-200); }
  page-visual-editor .gjs-am-assets-cont { background: var(--color-raised); }
  page-visual-editor .gjs-am-file-uploader > form { background: var(--color-raised); border: 2px dashed var(--color-slate-300); border-radius: 16px; color: var(--color-slate-600); }
  /* selection frame, badge and toolbar in the accent color instead of GrapesJS blue */
  page-visual-editor .gjs-badge, page-visual-editor .gjs-toolbar { background-color: var(--color-brand-500); color: var(--color-on-primary); border-radius: 8px; }
  page-visual-editor .gjs-toolbar-item { color: var(--color-on-primary); }
  page-visual-editor .gjs-resizer-h { border-color: var(--color-brand-500); }
  page-visual-editor .gjs-placeholder-int { background-color: var(--color-brand-500); }
`;

/** GrapesJS messages for the panel language, with the style property names in plain words. */
function messages(es: Record<string, any>) {
  const props = Object.fromEntries(['font-family', 'font-size', 'font-weight', 'color', 'text-align', 'line-height', 'letter-spacing', 'text-transform',
    'text-decoration', 'font-style', 'background-color', 'opacity', 'width', 'max-width', 'height', 'padding', 'margin', 'border-radius', 'border', 'box-shadow'].map(id => [id, I18n.t(`visual.prop.${id.replace(/-/g, '_')}`)]));
  const base = I18n.lang === 'es' ? es : {};
  const labels = Object.fromEntries(['href', 'target', 'title', 'alt'].map(id => [id, I18n.t(`visual.trait.${id}`)]));
  const traits = { ...(base.traitManager?.traits ?? {}), labels: { ...(base.traitManager?.traits?.labels ?? {}), ...labels },
    options: { target: { false: I18n.t('visual.trait.same_window'), _blank: I18n.t('visual.trait.new_window') } } };
  return { [I18n.lang]: { ...base,
    styleManager: { ...(base.styleManager ?? {}), properties: { ...(base.styleManager?.properties ?? {}), ...props } },
    traitManager: { ...(base.traitManager ?? {}), label: I18n.t('visual.settings'), traits } } };
}

/** Only inside the editor: reveal-on-scroll content is shown (it starts hidden until the site's JS animates it). */
const CANVAS_CSS = `
  .gjs-selected { outline: 2px solid #2f6fe4 !important; outline-offset: -2px; }
  .gjs-hovered { outline: 1px dashed #2f6fe4 !important; }
  .animate-on-scroll, .fade-in, .reveal, [data-aos] { opacity: 1 !important; transform: none !important; visibility: visible !important; }
`;

/** Ready-made pieces to drag into the page. They use the site's own classes (container, btn...) so they look like the rest. */
function blocks() {
  const t = (k: string) => I18n.t(`visual.block.${k}`);
  const cat = { basic: I18n.t('visual.cat.basic'), layout: I18n.t('visual.cat.layout') };
  return [
    { id: 'heading', label: t('heading'), category: cat.basic, media: svg('M4 6h16M4 12h10M4 18h7'),
      content: `<h2>${t('heading_text')}</h2>` },
    { id: 'text', label: t('text'), category: cat.basic, media: svg('M4 6h16M4 10h16M4 14h16M4 18h10'),
      content: `<p>${t('text_text')}</p>` },
    { id: 'button', label: t('button'), category: cat.basic, media: svg('M4 8h16v8H4z'),
      content: `<a href="#contacto" class="btn btn-primary">${t('button_text')}</a>` },
    { id: 'image', label: t('image'), category: cat.basic, media: svg('M4 5h16v14H4zM8 13l3 3 5-6 4 5'),
      content: { type: 'image', style: { 'max-width': '100%', height: 'auto' } } },
    { id: 'document', label: t('document'), category: cat.basic, media: svg('M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6'),
      content: `<a href="#" target="_blank" class="btn btn-outline">📄 ${t('document_text')}</a>` },
    { id: 'link', label: t('link'), category: cat.basic, media: svg('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'),
      content: `<a href="/">${t('link_text')}</a>` },
    { id: 'list', label: t('list'), category: cat.basic, media: svg('M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01'),
      content: `<ul><li>${t('list_item')} 1</li><li>${t('list_item')} 2</li><li>${t('list_item')} 3</li></ul>` },
    { id: 'section', label: t('section'), category: cat.layout, media: svg('M3 5h18v14H3z'),
      content: `<section style="padding:80px 0"><div class="container"><h2>${t('heading_text')}</h2><p>${t('text_text')}</p></div></section>` },
    { id: 'columns', label: t('columns'), category: cat.layout, media: svg('M3 5h8v14H3zM13 5h8v14h-8z'),
      content: `<div style="display:flex;flex-wrap:wrap;gap:32px"><div style="flex:1 1 280px"><h3>${t('heading_text')}</h3><p>${t('text_text')}</p></div><div style="flex:1 1 280px"><h3>${t('heading_text')}</h3><p>${t('text_text')}</p></div></div>` },
    { id: 'spacer', label: t('spacer'), category: cat.layout, media: svg('M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4'),
      content: '<div style="height:48px"></div>' },
  ];
}

/** Full style options (under "More options"), grouped by what they change. */
function sectors() {
  const p = (property: string, extra: Record<string, any> = {}) => ({ property, ...extra });   // labels come from messages()
  const fonts = [
    { id: '', label: I18n.t('quick.font_site') }, { id: "'Poppins', sans-serif", label: 'Poppins' }, { id: "'Montserrat', sans-serif", label: 'Montserrat' },
    { id: 'Arial, Helvetica, sans-serif', label: 'Arial' }, { id: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
    { id: "Georgia, 'Times New Roman', serif", label: 'Georgia' }, { id: "'Times New Roman', Times, serif", label: 'Times New Roman' },
    { id: "'Courier New', monospace", label: 'Courier New' },
  ];
  const weights = [['300', 'light'], ['400', 'normal'], ['600', 'semibold'], ['700', 'bold'], ['800', 'extrabold']]
    .map(([id, k]) => ({ id, label: I18n.t(`quick.weight.${k}`) }));
  return [
    { name: I18n.t('visual.sector.text'), open: true, properties: [
      p('font-family', { type: 'select', default: '', options: fonts }), p('font-size'), p('font-weight', { type: 'select', default: '', options: weights }),
      p('color'), p('text-align'), p('line-height'), p('letter-spacing'), p('text-transform'), p('text-decoration'), p('font-style'),
    ] },
    { name: I18n.t('visual.sector.background'), open: false, properties: [p('background-color'), p('opacity', { type: 'slider', min: 0, max: 1, step: 0.05, default: 1 })] },
    { name: I18n.t('visual.sector.size'), open: false, properties: [
      p('width'), p('max-width'), p('height'), p('padding'), p('margin'),
    ] },
    { name: I18n.t('visual.sector.border'), open: false, properties: [p('border-radius'), p('border'), p('box-shadow')] },
  ];
}

interface MediaDTO { id: number; name: string; src: string; type: 'image' | 'document' }

const svg = (d: string) =>
  `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
