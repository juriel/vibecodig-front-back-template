import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlobalConfig } from '../../global-config';
import { SessionStatus } from '../../lib/session';
import { icon } from '../../lib/icons';
import { I18n } from '../../lib/i18n';

interface QuickLink { path: string; icon: string; label: string; desc: string; privileges?: string[] }

const A = GlobalConfig.getInstance().adminBase;
/** The site-building sections (the same eight as TitiCMS). Pages first and highlighted; account, users, etc. stay in the menus. */
const QUICK: QuickLink[] = [
  { path: `${A}/pages`, icon: 'globe', label: 'menu.pages', desc: 'menu.pages_desc', privileges: ['VIEW_CMS_PAGE'] },
  { path: `${A}/widgets`, icon: 'dashboard', label: 'menu.widgets', desc: 'menu.widgets_desc', privileges: ['VIEW_CMS_PAGE'] },
  { path: `${A}/files`, icon: 'photo', label: 'menu.files', desc: 'menu.files_desc', privileges: ['VIEW_FOLDER'] },
  { path: `${A}/folders`, icon: 'folder', label: 'menu.folders', desc: 'menu.folders_desc', privileges: ['VIEW_FOLDER'] },
  { path: `${A}/layouts`, icon: 'layers', label: 'menu.layouts', desc: 'menu.layouts_desc', privileges: ['VIEW_CMS_LAYOUT'] },
  { path: `${A}/css`, icon: 'palette', label: 'menu.css', desc: 'menu.css_desc', privileges: ['VIEW_CMS_LAYOUT'] },
  { path: `${A}/javascripts`, icon: 'code', label: 'menu.javascripts', desc: 'menu.javascripts_desc', privileges: ['VIEW_CMS_LAYOUT'] },
  { path: `${A}/global-settings`, icon: 'cog', label: 'menu.global_settings', desc: 'menu.global_settings_desc', privileges: ['VIEW_GLOBAL_CONFIGURATION'] },
];

@customElement('home-page')
export class HomePage extends LitElement {
  createRenderRoot() { return this; }

  private visible(i: { privileges?: string[] }) {
    const s = SessionStatus.getInstance();
    return !GlobalConfig.getInstance().authRequired || !i.privileges?.length || i.privileges.some(p => s.can(p));
  }

  private tile(t: QuickLink, featured: boolean) {
    return html`
      <a href=${t.path}
         class="group flex flex-col gap-3 rounded-[22px] border p-5 shadow-card transition ${featured
           ? 'border-brand-500 bg-brand-500 text-on-primary hover:brightness-110'
           : 'border-slate-200 bg-surface hover:border-accent-500 focus-visible:border-accent-500'}">
        <span class="flex size-12 items-center justify-center rounded-2xl ${featured ? 'on-primary-soft' : 'bg-accent-50 text-accent-600'}">${icon(t.icon, 'size-7')}</span>
        <span>
          <span class="block font-display text-[1.6rem] font-semibold leading-[1.1] ${featured ? '' : 'text-slate-900'}">${I18n.t(t.label)}</span>
          <span class="mt-1 block text-[15px] leading-snug ${featured ? 'opacity-85' : 'text-slate-500'}">${I18n.t(t.desc)}</span>
        </span>
      </a>`;
  }

  render() {
    const user = SessionStatus.getInstance().user;
    const quick = QUICK.filter(t => this.visible(t));
    return html`
      <header class="home-hero">
        <h1 class="font-display text-7xl font-bold uppercase leading-[0.85] tracking-[-0.01em] text-brand-600 xl:text-8xl 2xl:text-9xl">
          ${user ? I18n.t('home.hello_user', user.name ?? user.login) : I18n.t('home.welcome')}
        </h1>
      </header>
      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${quick.map((t, i) => this.tile(t, i === 0))}
      </div>`;
  }
}
