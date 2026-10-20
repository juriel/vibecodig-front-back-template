import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { AuthService } from './auth.service';
import { SessionStatus } from '../../lib/session';
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
      Router.go(GlobalConfig.getInstance().adminBase);
    } catch (err: any) {
      const d = err.response?.data?.detail;
      this.error = typeof d === 'string' ? d : I18n.t('login.error');   // the API message is already translated
    } finally {
      this.loading = false;
    }
  }

  render() {
    const name = GlobalConfig.getInstance().appName;
    return html`
      <div class="grid min-h-screen lg:grid-cols-2">
        <div class="relative hidden overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div class="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl"></div>
          <div class="absolute -bottom-32 -left-20 size-96 rounded-full bg-brand-400/20 blur-3xl"></div>
          <div class="relative flex items-center gap-3">
            <span class="flex size-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold ring-1 ring-white/20">${name.charAt(0)}</span>
            <span class="text-lg font-semibold">${name}</span>
          </div>
          <div class="relative max-w-md">
            <h2 class="text-4xl font-semibold leading-tight tracking-tight">${I18n.t('login.brand_title')}</h2>
            <p class="mt-4 text-brand-100">${I18n.t('login.brand_text')}</p>
          </div>
          <p class="relative text-xs text-brand-200">© ${new Date().getFullYear()} ${name}</p>
        </div>

        <div class="relative flex items-center justify-center bg-white px-6 py-12">
          <div class="absolute right-4 top-4"><lang-switch></lang-switch></div>
          <form class="w-full max-w-sm" @submit=${this.submit}>
            <h1 class="text-2xl font-semibold tracking-tight text-slate-900">${I18n.t('login.title')}</h1>
            <p class="mt-1.5 text-sm text-slate-500">${I18n.t('login.subtitle')}</p>

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
                  <button type="button" class="absolute inset-y-0 right-3 text-xs font-medium text-brand-600 hover:text-brand-700"
                          @click=${() => { this.showPassword = !this.showPassword; }}>${I18n.t(this.showPassword ? 'login.hide' : 'login.show')}</button>
                </div>
              </div>
            </div>

            <button type="submit" class="${btn('primary')} mt-6 w-full py-2.5" ?disabled=${this.loading}>
              ${this.loading ? html`<span class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>${I18n.t('login.submitting')}` : I18n.t('login.submit')}
            </button>
          </form>
        </div>
      </div>`;
  }
}
