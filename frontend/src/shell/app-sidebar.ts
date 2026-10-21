import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MENU, MenuItem } from '../menu';
import { SessionStatus } from '../lib/session';
import { GlobalConfig } from '../global-config';
import { icon } from '../lib/icons';
import { I18n } from '../lib/i18n';

/** Collapsible sidebar with submenus, filtered by privileges. On mobile it is a slide-in panel (`open`). */
@customElement('app-sidebar')
export class AppSidebar extends LitElement {
  @property({ type: Boolean }) collapsed = false;
  @property({ type: Boolean }) open = false;           // mobile only
  @property() path = location.pathname;
  @state() private expanded = new Set<string>();

  createRenderRoot() { return this; }

  private visible(item: MenuItem): boolean {
    const s = SessionStatus.getInstance();
    if (!GlobalConfig.getInstance().authRequired) return true;
    if (item.children) return item.children.some(c => this.visible(c));
    return !item.privileges?.length || item.privileges.some(p => s.can(p));
  }

  private isActive(item: MenuItem): boolean {
    if (item.path) {
      const base = GlobalConfig.getInstance().adminBase;
      return item.path === base ? this.path === base : this.path === item.path || this.path.startsWith(item.path + '/');
    }
    return !!item.children?.some(c => this.isActive(c));
  }

  private toggle(label: string) {
    const next = new Set(this.expanded);
    next.has(label) ? next.delete(label) : next.add(label);
    this.expanded = next;
  }

  private link(item: MenuItem, nested = false): TemplateResult {
    const active = this.isActive(item);
    return html`
      <a href=${item.path!} title=${I18n.t(item.label)} @click=${() => this.dispatchEvent(new CustomEvent('navigate'))}
         class="group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition
                ${active ? 'bg-accent-50 text-accent-700' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-slate-900'}
                ${nested ? 'pl-4' : ''}">
        ${icon(item.icon ?? 'dashboard', nested ? 'size-4' : 'size-5')}
        ${this.collapsed && !this.open ? '' : html`<span class="flex-1 leading-tight">${I18n.t(item.label)}</span>
          ${active ? html`<span class="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true"></span>` : ''}`}
      </a>`;
  }

  private group(item: MenuItem): TemplateResult {
    const compact = this.collapsed && !this.open;
    const isOpen = this.expanded.has(item.label) || (this.isActive(item) && !this.expanded.has('!' + item.label));
    return html`
      <div>
        <button class="flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition
                       ${this.isActive(item) ? 'text-slate-900' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-slate-900'}"
                title=${I18n.t(item.label)} @click=${() => this.toggle(item.label)}>
          ${icon(item.icon ?? 'dashboard')}
          ${compact ? '' : html`
            <span class="flex-1 truncate text-left">${I18n.t(item.label)}</span>
            ${icon('chevron-down', `size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`)}`}
        </button>
        ${isOpen && !compact ? html`
          <div class="ml-5 mt-1 space-y-0.5 border-l border-slate-200 pl-2">
            ${item.children!.filter(c => this.visible(c)).map(c => this.link(c, true))}
          </div>` : ''}
      </div>`;
  }

  render() {
    const name = GlobalConfig.getInstance().appName;
    const compact = this.collapsed && !this.open;
    return html`
      ${this.open ? html`<div class="fixed inset-0 z-30 bg-black/60 md:hidden" @click=${() => this.dispatchEvent(new CustomEvent('navigate'))}></div>` : ''}
      <aside class="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-sidebar transition-all duration-200
                    ${this.open ? 'translate-x-0 w-64' : '-translate-x-full'} md:sticky md:top-0 md:h-screen md:translate-x-0
                    ${compact ? 'md:w-[4.5rem]' : 'md:w-64'}">
        <div class="flex h-16 items-center gap-3 px-4">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-500 font-display text-lg font-bold text-on-accent">${name.charAt(0)}</span>
          ${compact ? '' : html`<span class="truncate font-display text-xl font-semibold tracking-wide text-slate-900">${name}</span>`}
        </div>
        <nav class="flex-1 space-y-1 overflow-y-auto p-3">
          ${MENU.filter(i => this.visible(i)).map(i => i.children ? this.group(i) : this.link(i))}
        </nav>
      </aside>`;
  }
}
