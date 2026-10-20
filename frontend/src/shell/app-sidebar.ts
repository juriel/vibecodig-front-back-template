import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MENU, MenuItem } from '../menu';
import { SessionStatus } from '../lib/session';
import { GlobalConfig } from '../global-config';
import { icon } from '../lib/icons';

/** Sidebar colapsable con submenús, filtrado por privilegios. En móvil es un panel deslizable (`open`). */
@customElement('app-sidebar')
export class AppSidebar extends LitElement {
  @property({ type: Boolean }) collapsed = false;
  @property({ type: Boolean }) open = false;           // solo móvil
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
    if (item.path) return item.path === '/' ? this.path === '/' : this.path === item.path || this.path.startsWith(item.path + '/');
    return !!item.children?.some(c => this.isActive(c));
  }

  private toggle(title: string) {
    const next = new Set(this.expanded);
    next.has(title) ? next.delete(title) : next.add(title);
    this.expanded = next;
  }

  private link(item: MenuItem, nested = false): TemplateResult {
    const active = this.isActive(item);
    return html`
      <a href=${item.path!} title=${item.title} @click=${() => this.dispatchEvent(new CustomEvent('navigate'))}
         class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
                ${active ? 'bg-brand-500/25 text-white' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'}
                ${nested ? 'pl-4' : ''}">
        ${icon(item.icon ?? 'dashboard', nested ? 'size-4' : 'size-5')}
        ${this.collapsed && !this.open ? '' : html`<span class="truncate">${item.title}</span>`}
      </a>`;
  }

  private group(item: MenuItem): TemplateResult {
    const compact = this.collapsed && !this.open;
    const isOpen = this.expanded.has(item.title) || (this.isActive(item) && !this.expanded.has('!' + item.title));
    return html`
      <div>
        <button class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
                       ${this.isActive(item) ? 'text-white' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'}"
                title=${item.title} @click=${() => this.toggle(item.title)}>
          ${icon(item.icon ?? 'dashboard')}
          ${compact ? '' : html`
            <span class="flex-1 truncate text-left">${item.title}</span>
            ${icon('chevron-down', `size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`)}`}
        </button>
        ${isOpen && !compact ? html`
          <div class="ml-4 mt-1 space-y-1 border-l border-white/10 pl-2">
            ${item.children!.filter(c => this.visible(c)).map(c => this.link(c, true))}
          </div>` : ''}
      </div>`;
  }

  render() {
    const name = GlobalConfig.getInstance().appName;
    const compact = this.collapsed && !this.open;
    return html`
      ${this.open ? html`<div class="fixed inset-0 z-30 bg-slate-900/50 md:hidden" @click=${() => this.dispatchEvent(new CustomEvent('navigate'))}></div>` : ''}
      <aside class="fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar transition-all duration-200
                    ${this.open ? 'translate-x-0 w-64' : '-translate-x-full'} md:static md:translate-x-0
                    ${compact ? 'md:w-[4.5rem]' : 'md:w-64'}">
        <div class="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">${name.charAt(0)}</span>
          ${compact ? '' : html`<span class="truncate text-base font-semibold text-white">${name}</span>`}
        </div>
        <nav class="flex-1 space-y-1 overflow-y-auto p-3">
          ${MENU.filter(i => this.visible(i)).map(i => i.children ? this.group(i) : this.link(i))}
        </nav>
      </aside>`;
  }
}
