import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SessionStatus } from '../lib/session';
import { GlobalConfig } from '../global-config';
import { icon } from '../lib/icons';
import { I18n } from '../lib/i18n';
import './lang-switch';

/** Top bar: menu button, language selector, user and sign out. */
@customElement('app-header')
export class AppHeader extends LitElement {
  @property({ type: Boolean }) collapsed = false;
  @state() private menuOpen = false;

  createRenderRoot() { return this; }

  private onOutside = (e: MouseEvent) => { if (!this.contains(e.target as Node)) this.menuOpen = false; };
  private onSession = () => this.requestUpdate();
  connectedCallback() { super.connectedCallback(); window.addEventListener('click', this.onOutside); window.addEventListener('session-change', this.onSession); }
  disconnectedCallback() { window.removeEventListener('click', this.onOutside); window.removeEventListener('session-change', this.onSession); super.disconnectedCallback(); }

  render() {
    const auth = GlobalConfig.getInstance().authRequired;
    const user = SessionStatus.getInstance().user;
    const name: string = user?.name ?? user?.login ?? I18n.t('header.user');
    return html`
      <header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-ink/85 px-4 backdrop-blur md:px-6">
        <button class="inline-flex size-9 items-center justify-center rounded-full text-slate-600 hover:bg-raised hover:text-slate-900" aria-label="${I18n.t('header.menu')}"
                @click=${() => this.dispatchEvent(new CustomEvent('toggle-menu'))}>${icon('menu')}</button>
        <div class="flex-1"></div>
        <lang-switch></lang-switch>
        ${auth ? html`
          <div class="relative">
            <button class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-raised" @click=${() => { this.menuOpen = !this.menuOpen; }}>
              <span class="flex size-8 items-center justify-center rounded-full bg-accent-500 text-sm font-semibold text-on-accent">${name.charAt(0).toUpperCase()}</span>
              <span class="hidden text-sm font-medium text-slate-700 sm:block">${name}</span>
              ${icon('chevron-down', 'size-4 text-slate-400')}
            </button>
            ${this.menuOpen ? html`
              <div class="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-surface p-1.5 shadow-2xl shadow-black/40">
                <div class="px-3 py-2 text-xs text-slate-500">${I18n.t('header.signed_in_as')}<br><span class="font-medium text-slate-800">${name}</span></div>
                <a href="${GlobalConfig.getInstance().adminBase}/account" @click=${() => { this.menuOpen = false; }}
                   class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-raised hover:text-slate-900">${icon('user', 'size-4')}${I18n.t('header.my_account')}</a>
                <button class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-raised hover:text-slate-900"
                        @click=${() => SessionStatus.getInstance().logout()}>${icon('logout', 'size-4')}${I18n.t('header.sign_out')}</button>
              </div>` : ''}
          </div>` : ''}
      </header>`;
  }
}
