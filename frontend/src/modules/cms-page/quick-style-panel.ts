import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Component, Editor } from 'grapesjs';
import { I18n } from '../../lib/i18n';

type Styles = Record<string, string>;

/** General colors offered after the site's own (key = i18n name under quick.color.*). */
const COMMON_COLORS: [string, string][] = [
  ['red', '#e53935'], ['pink', '#ec407a'], ['magenta', '#d81b60'], ['purple', '#8e24aa'], ['indigo', '#3949ab'], ['blue', '#1e88e5'],
  ['sky', '#29b6f6'], ['cyan', '#00acc1'], ['green', '#43a047'], ['lime', '#9ccc65'], ['yellow', '#fdd835'], ['amber', '#ffb300'],
  ['orange', '#fb8c00'], ['deep_orange', '#f4511e'], ['brown', '#6d4c41'], ['gray', '#9e9e9e'], ['light_gray', '#eeeeee'], ['dark_gray', '#424242'],
];

/**
 * One-click style controls for the selected element (colors, size, font, alignment, corners, shadow, spacing, button look).
 * Changes go through the Style Manager, so they land on the element's own rule and respect the device in use
 * (editing in "Mobile" only changes the mobile view).
 */
@customElement('quick-style-panel')
export class QuickStylePanel extends LitElement {
  @property({ attribute: false }) editor!: Editor;
  @property({ attribute: false }) component!: Component;
  @state() private tick = 0;           // re-render after any style change
  private palette: { name: string; value: string }[] = [];

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this.editor.on('component:styleUpdate component:update:classes undo redo', this.refresh);
  }

  disconnectedCallback() {
    this.editor.off('component:styleUpdate component:update:classes undo redo', this.refresh);
    super.disconnectedCallback();
  }

  private refresh = () => { this.tick++; };

  /** Site colors: the CSS custom properties of :root that hold a color, plus white and black. */
  private colors() {
    if (this.palette.length) return this.palette;
    const found = new Map<string, string>();
    const doc = this.editor.Canvas.getDocument();
    for (const sheet of Array.from(doc?.styleSheets ?? [])) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }     // cross-origin sheet (Google Fonts)
      for (const rule of Array.from(rules)) {
        if (!(rule instanceof (doc!.defaultView as any).CSSStyleRule) || (rule as CSSStyleRule).selectorText !== ':root') continue;
        const style = (rule as CSSStyleRule).style;
        for (const prop of Array.from(style)) {
          const value = style.getPropertyValue(prop).trim();
          if (prop.startsWith('--') && /^(#[0-9a-f]{3,8}|rgba?\([^)]*\))$/i.test(value) && ![...found.values()].includes(value.toLowerCase()))
            found.set(prop.slice(2), value.toLowerCase());
        }
      }
    }
    this.palette = [...found].slice(0, 14).map(([name, value]) => ({ name, value }));
    for (const [name, value] of [['white', '#ffffff'], ['black', '#000000']] as const)
      if (!this.palette.some(c => c.value === value)) this.palette.push({ name, value });
    return this.palette;
  }

  private computed(prop: string): string {
    const el = this.component.getEl();
    const win = this.editor.Canvas.getWindow();
    return el && win ? win.getComputedStyle(el).getPropertyValue(prop) : '';
  }

  private own(prop: string): string {
    return (this.component.getStyle() as Styles)[prop] ?? '';
  }

  private set(styles: Styles) {
    this.editor.StyleManager.addStyleTargets(styles, {});
    this.refresh();
  }

  private toggle(prop: string, on: string, off = '') {
    this.set({ [prop]: this.computed(prop).includes(on) ? off : on });
  }

  private resize(delta: number) {
    const current = parseFloat(this.computed('font-size')) || 16;
    this.set({ 'font-size': `${Math.max(8, Math.round(current + delta))}px` });
  }

  private setButtonLook(look: 'primary' | 'outline') {
    const c = this.component;
    c.removeClass(['btn-primary', 'btn-outline']);
    c.addClass(['btn', `btn-${look}`]);
    this.set({ background: '', 'background-color': '', 'background-image': '', color: '', 'border-color': '' });  // back to the site's look
  }

  private reset() {
    this.component.setStyle({});
    this.refresh();
  }

  private swatches(prop: 'color' | 'background', current: string) {
    const apply = (value: string) => this.set(prop === 'color'
      ? { color: value }
      : { background: value, 'background-image': 'none' });     // also hides gradients such as the site's buttons
    const dot = (title: string, value: string, small = false) => html`
      <button type="button" title=${title} @click=${() => apply(value)}
              class="${small ? 'size-6' : 'size-7'} rounded-full border ${current === value ? 'ring-2 ring-brand-500 ring-offset-1' : ''} border-slate-300 shadow-sm"
              style="background:${value}"></button>`;
    return html`
      <p class="text-[11px] text-slate-400">${I18n.t('quick.site_colors')}</p>
      <div class="flex flex-wrap items-center gap-1.5">
        ${this.colors().map(c => dot(c.name, c.value))}
      </div>
      <p class="text-[11px] text-slate-400">${I18n.t('quick.more_colors')}</p>
      <div class="flex flex-wrap items-center gap-1.5">
        ${COMMON_COLORS.map(([k, v]) => dot(I18n.t(`quick.color.${k}`), v, true))}
        <label class="relative grid size-7 cursor-pointer place-items-center rounded-full border border-dashed border-slate-400 text-xs text-slate-500" title=${I18n.t('quick.other_color')}>
          +<input type="color" class="absolute inset-0 cursor-pointer opacity-0" .value=${/^#[0-9a-f]{6}$/i.test(current) ? current : '#2d9b9b'}
                  @input=${(e: Event) => apply((e.target as HTMLInputElement).value)} />
        </label>
        ${prop === 'background' ? html`
          <button type="button" class="${this.chip(false)}" @click=${() => this.set({ background: 'transparent', 'background-image': 'none' })}>${I18n.t('quick.no_background')}</button>` : nothing}
      </div>`;
  }

  private chip(active: boolean) {
    return `rounded-md border px-2.5 py-1 text-xs font-medium transition ${active
      ? 'border-brand-500 bg-brand-50 text-brand-700'
      : 'border-slate-200 bg-raised text-slate-700 hover:border-brand-400 hover:text-brand-700'}`;
  }

  private row(label: string, body: unknown) {
    return html`<div class="space-y-1.5"><p class="text-xs font-medium text-slate-600">${label}</p>${body}</div>`;
  }

  render() {
    void this.tick;
    const c = this.component;
    if (!c) return nothing;
    const isImage = c.is('image');
    const isButton = c.is('link') && c.getClasses().includes('btn');
    const hasText = !isImage;
    const toHex = (rgb: string) => {          // computed colors come as rgb()/rgba(); a fully transparent one is "no color"
      const m = rgb.match(/[\d.]+/g);
      if (!m || m.length < 3 || (m.length > 3 && +m[3] === 0)) return '';
      return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
    };
    const color = toHex(this.computed('color'));
    const bg = toHex(this.computed('background-color'));
    const size = Math.round(parseFloat(this.computed('font-size')) || 0);
    const align = this.computed('text-align');
    const weight = parseInt(this.computed('font-weight')) || 400;
    const family = this.own('font-family');
    const radius = this.own('border-radius');
    const shadow = this.own('box-shadow');
    const padding = this.own('padding');
    const width = this.own('width');

    const sizes: [string, number][] = [['small', 14], ['normal', 16], ['large', 20], ['heading', 32], ['huge', 48]];
    const fonts: [string, string][] = [['', I18n.t('quick.font_site')], ["'Poppins', sans-serif", 'Poppins'], ["'Montserrat', sans-serif", 'Montserrat'],
      ['Arial, Helvetica, sans-serif', 'Arial'], ['Verdana, Geneva, sans-serif', 'Verdana'], ["Georgia, 'Times New Roman', serif", 'Georgia'],
      ["'Times New Roman', Times, serif", 'Times New Roman'], ["'Courier New', monospace", 'Courier New']];
    const radii: [string, string][] = [['0', 'square'], ['8px', 'soft'], ['16px', 'round'], ['999px', 'pill']];
    const shadows: [string, string][] = [['none', 'none'], ['0 4px 14px rgba(0,0,0,.10)', 'soft'], ['0 12px 32px rgba(0,0,0,.18)', 'strong']];
    const paddings: [string, string][] = [['0', 'none'], ['8px 16px', 'small'], ['16px 32px', 'medium'], ['28px 48px', 'large']];

    return html`
      <div class="space-y-4 border-b border-slate-200 p-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-800">${I18n.t('quick.title')}</p>
          <button type="button" class="text-xs font-medium text-slate-500 hover:text-red-600" title=${I18n.t('quick.reset_help')} @click=${() => this.reset()}>${I18n.t('quick.reset')}</button>
        </div>

        ${isButton ? this.row(I18n.t('quick.button_look'), html`
          <div class="flex gap-1.5">
            <button type="button" class=${this.chip(c.getClasses().includes('btn-primary'))} @click=${() => this.setButtonLook('primary')}>${I18n.t('quick.button_primary')}</button>
            <button type="button" class=${this.chip(c.getClasses().includes('btn-outline'))} @click=${() => this.setButtonLook('outline')}>${I18n.t('quick.button_outline')}</button>
          </div>`) : nothing}

        ${hasText ? html`
          ${this.row(I18n.t('quick.text_color'), this.swatches('color', color))}
          ${this.row(I18n.t('quick.text_size'), html`
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" class=${this.chip(false)} title=${I18n.t('quick.smaller')} @click=${() => this.resize(-2)}>A−</button>
              <span class="w-12 text-center text-xs tabular-nums text-slate-600">${size}px</span>
              <button type="button" class=${this.chip(false)} title=${I18n.t('quick.bigger')} @click=${() => this.resize(2)}>A+</button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${sizes.map(([k, px]) => html`<button type="button" class=${this.chip(size === px)} @click=${() => this.set({ 'font-size': `${px}px` })}>${I18n.t(`quick.size.${k}`)}</button>`)}
            </div>`)}
          ${this.row(I18n.t('quick.font'), html`
            <select class="block w-full rounded-lg border border-slate-300 bg-raised px-2.5 py-1.5 text-sm text-slate-900" @change=${(e: Event) => this.set({ 'font-family': (e.target as HTMLSelectElement).value })}>
              ${fonts.map(([v, l]) => html`<option value=${v} ?selected=${family === v} style=${v ? `font-family:${v}` : ''}>${l}</option>`)}
            </select>`)}
          ${this.row(I18n.t('quick.format'), html`
            <div class="flex flex-wrap gap-1.5">
              <button type="button" class="${this.chip(weight >= 600)} font-bold" @click=${() => this.set({ 'font-weight': weight >= 600 ? '400' : '700' })}>${I18n.t('quick.bold')}</button>
              <button type="button" class="${this.chip(this.computed('font-style') === 'italic')} italic" @click=${() => this.toggle('font-style', 'italic', 'normal')}>${I18n.t('quick.italic')}</button>
              <button type="button" class="${this.chip(this.computed('text-decoration-line').includes('underline'))} underline" @click=${() => this.toggle('text-decoration', 'underline', 'none')}>${I18n.t('quick.underline')}</button>
              <button type="button" class=${this.chip(this.computed('text-transform') === 'uppercase')} @click=${() => this.toggle('text-transform', 'uppercase', 'none')}>${I18n.t('quick.uppercase')}</button>
            </div>`)}
          ${this.row(I18n.t('quick.align'), html`
            <div class="flex gap-1.5">
              ${['left', 'center', 'right', 'justify'].map(a => html`
                <button type="button" class=${this.chip(align === a || (a === 'left' && align === 'start'))} @click=${() => this.set({ 'text-align': a })}>${I18n.t(`quick.align.${a}`)}</button>`)}
            </div>`)}` : nothing}

        ${isImage ? this.row(I18n.t('quick.image_width'), html`
          <div class="flex flex-wrap gap-1.5">
            ${['25%', '50%', '75%', '100%'].map(w => html`<button type="button" class=${this.chip(width === w)} @click=${() => this.set({ width: w, 'max-width': '100%', height: 'auto' })}>${w}</button>`)}
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" class=${this.chip(false)} @click=${() => this.set({ display: 'block', 'margin-left': 'auto', 'margin-right': 'auto' })}>${I18n.t('quick.center_image')}</button>
          </div>`) : nothing}

        ${this.row(I18n.t('quick.background'), this.swatches('background', bg))}
        ${this.row(I18n.t('quick.corners'), html`
          <div class="flex flex-wrap gap-1.5">${radii.map(([v, k]) => html`<button type="button" class=${this.chip(radius === v)} @click=${() => this.set({ 'border-radius': v })}>${I18n.t(`quick.radius.${k}`)}</button>`)}</div>`)}
        ${this.row(I18n.t('quick.shadow'), html`
          <div class="flex flex-wrap gap-1.5">${shadows.map(([v, k]) => html`<button type="button" class=${this.chip(shadow === v)} @click=${() => this.set({ 'box-shadow': v })}>${I18n.t(`quick.shadow.${k}`)}</button>`)}</div>`)}
        ${isImage ? nothing : this.row(I18n.t('quick.padding'), html`
          <div class="flex flex-wrap gap-1.5">${paddings.map(([v, k]) => html`<button type="button" class=${this.chip(padding === v)} @click=${() => this.set({ padding: v })}>${I18n.t(`quick.padding.${k}`)}</button>`)}</div>`)}
      </div>`;
  }
}
