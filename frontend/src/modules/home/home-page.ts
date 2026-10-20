import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlobalConfig } from '../../global-config';
import { SessionStatus } from '../../lib/session';
import { MENU, MenuItem, leaves } from '../../menu';
import { icon } from '../../lib/icons';

@customElement('home-page')
export class HomePage extends LitElement {
  createRenderRoot() { return this; }

  private visible(i: MenuItem) {
    const s = SessionStatus.getInstance();
    return !GlobalConfig.getInstance().authRequired || !i.privileges?.length || i.privileges.some(p => s.can(p));
  }

  render() {
    const cfg = GlobalConfig.getInstance();
    const user = SessionStatus.getInstance().user;
    const tiles = leaves(MENU).filter(i => i.path !== cfg.adminBase && this.visible(i));
    return html`
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">¡Bienvenido${user ? `, ${user.name ?? user.login}` : ''}!</h1>
      <p class="mt-1 text-slate-500">Elige una sección para empezar.</p>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        ${tiles.map(t => html`
          <a href=${t.path!} class="group flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
            <span class="flex size-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">${icon(t.icon ?? 'dashboard', 'size-7')}</span>
            <span class="text-sm font-medium text-slate-700">${t.title}</span>
          </a>`)}
      </div>`;
  }
}
