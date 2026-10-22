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

  /** The demo video plays on its own (muted, in a loop), except with reduced motion: then it stays on its first frame. */
  firstUpdated() {
    const video = this.querySelector<HTMLVideoElement>('.login-video');
    if (video && !matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
  }

  render() {
    return html`
      <div class="grid min-h-screen bg-ink lg:grid-cols-[1.15fr_1fr]">
        <div class="relative hidden overflow-hidden border-r border-slate-200 bg-[#f1f5f9] lg:block">
          <!-- How the panel works: made with Remotion in ~/Documents/video-promo (composition CmsDemo) -->
          <video class="login-video absolute inset-0 size-full object-cover" src="/assets/video/panel-demo.mp4"
                 muted loop playsinline preload="auto" aria-hidden="true"></video>
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
