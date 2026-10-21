import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { AuthService } from './auth.service';
import { SessionStatus } from '../../lib/session';
import { Theme } from '../../lib/theme';
import { GlobalConfig } from '../../global-config';
import { icon } from '../../lib/icons';
import { ui, btn } from '../../lib/ui';
import { I18n } from '../../lib/i18n';
import '../../shell/lang-switch';

@customElement('login-page')
export class LoginPage extends LitElement {
  @state() private loading = false;
  @state() private error = '';
  @state() private showPassword = false;

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    if (SessionStatus.getInstance().isLoggedIn) Router.go(GlobalConfig.getInstance().adminBase);
  }

  private async submit(e: SubmitEvent) {
    e.preventDefault();
    const f = new FormData(e.target as HTMLFormElement);
    this.loading = true;
    this.error = '';
    try {
      const session = await AuthService.login({ login: String(f.get('login')), password: String(f.get('password')) });
      SessionStatus.getInstance().save(session);
      Theme.apply(session.preferences);
      Router.go(GlobalConfig.getInstance().adminBase);
    } catch (err: any) {
      const d = err.response?.data?.detail;
      this.error = typeof d === 'string' ? d : I18n.t('login.error');   // the API message is already translated
    } finally {
      this.loading = false;
    }
  }

  /** A cursor that glides somewhere on the left side and clicks, leaving a ripple. Off with reduced motion. */
  private static RIPPLE_COLORS = ['var(--color-brand-500)', 'var(--color-accent-500)'];
  private cursorTimer = 0;

  firstUpdated() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const stage = this.querySelector<HTMLElement>('.login-stage');
    if (stage) this.moveCursor(stage);
  }

  disconnectedCallback() {
    clearTimeout(this.cursorTimer);
    super.disconnectedCallback();
  }

  /** The cursor glides to a random spot, clicks (ripple in one of the user's colors) and goes on to the next one. */
  private moveCursor(stage: HTMLElement) {
    const cursor = this.querySelector<HTMLElement>('.login-cursor');
    if (!cursor) return;
    const go = () => {
      const tx = 40 + Math.random() * (stage.clientWidth - 120), ty = 160 + Math.random() * (stage.clientHeight - 260);
      cursor.style.transform = `translate(${tx}px, ${ty}px)`;
      this.cursorTimer = window.setTimeout(() => {
        cursor.classList.add('clicking');
        this.ripple(stage, tx + 4, ty + 4);
        window.setTimeout(() => cursor.classList.remove('clicking'), 180);
        this.cursorTimer = window.setTimeout(go, 1600);
      }, 1500);
    };
    this.cursorTimer = window.setTimeout(go, 600);
  }

  private ripple(stage: HTMLElement, x: number, y: number) {
    const colors = LoginPage.RIPPLE_COLORS;
    const r = document.createElement('span');
    r.className = 'login-ripple';
    r.style.cssText = `left:${x}px;top:${y}px;--c:${colors[Math.floor(Math.random() * colors.length)]}`;
    stage.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  }

  render() {
    const name = GlobalConfig.getInstance().appName;
    return html`
      <div class="grid min-h-screen bg-ink lg:grid-cols-[1.15fr_1fr]">
        <div class="relative hidden overflow-hidden border-r border-slate-200 p-12 lg:flex lg:flex-col lg:justify-between">
          <div class="login-stage pointer-events-none absolute inset-0" aria-hidden="true">
            <svg class="login-cursor absolute left-0 top-0 size-8" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L10 19z" fill="#0f172a" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>
          </div>
          <div class="relative z-10 flex items-center gap-3">
            <span class="flex size-10 items-center justify-center rounded-full bg-accent-500 font-display text-xl font-bold text-on-accent">${name.charAt(0)}</span>
            <span class="font-display text-2xl font-semibold tracking-wide text-slate-900">${name}</span>
          </div>
          <h2 class="relative z-10 font-display text-7xl font-bold uppercase leading-[0.88] tracking-tight text-brand-600 2xl:text-8xl">
            ${I18n.t('login.brand_title').split('|').map(line => html`<span class="block">${line}</span>`)}
          </h2>
          <p class="relative z-10 text-xs text-slate-400">© ${new Date().getFullYear()} ${name}</p>
        </div>

        <div class="relative flex items-center justify-center px-6 py-12">
          <div class="absolute right-4 top-4"><lang-switch></lang-switch></div>
          <form class="w-full max-w-sm rounded-[28px] border border-slate-200 bg-surface p-8" @submit=${this.submit}>
            <h1 class="font-display text-4xl font-semibold uppercase leading-none tracking-tight text-slate-900">${I18n.t('login.title')}</h1>
            <p class="mt-2 text-sm text-slate-500">${I18n.t('login.subtitle')}</p>

            ${this.error ? html`<p class="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">${this.error}</p>` : ''}

            <div class="mt-6 space-y-4">
              <div>
                <label for="login" class=${ui.label}>${I18n.t('login.user')}</label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">${icon('user', 'size-4')}</span>
                  <input id="login" name="login" required autocomplete="username" autofocus class="${ui.input} pl-9" />
                </div>
              </div>
              <div>
                <label for="password" class=${ui.label}>${I18n.t('login.password')}</label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">${icon('lock', 'size-4')}</span>
                  <input id="password" name="password" required autocomplete="current-password" type=${this.showPassword ? 'text' : 'password'} class="${ui.input} pl-9 pr-16" />
                  <button type="button" class="absolute inset-y-0 right-3 text-xs font-medium text-brand-500 hover:text-brand-700"
                          @click=${() => { this.showPassword = !this.showPassword; }}>${I18n.t(this.showPassword ? 'login.hide' : 'login.show')}</button>
                </div>
              </div>
            </div>

            <button type="submit" class="${btn('primary')} mt-7 w-full py-3" ?disabled=${this.loading}>
              ${this.loading ? html`<span class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>${I18n.t('login.submitting')}` : I18n.t('login.submit')}
            </button>
          </form>
        </div>
      </div>`;
  }
}
