import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import axios from 'axios';
import { GlobalConfig } from '../../global-config';
import { SessionStatus } from '../../lib/session';
import { Theme, ThemeName, colorsOf } from '../../lib/theme';
import { PALETTES } from '../../lib/palettes';
import { I18n } from '../../lib/i18n';
import { ui, btn } from '../../lib/ui';
import { icon } from '../../lib/icons';
import { toast, confirmDialog } from '../../lib/toast';
import { formatDateTimeString } from '../../lib/date';
import { titleBand } from '../../lib/title-band';

interface ApiToken { id: number; name: string; prefix: string; created_at: string; last_used_at: string | null; token?: string }

/** "My account": the signed-in user's own data, appearance (theme, saved in the account), language, password and
 *  the personal tokens that connect Claude (MCP) with their permissions. */
@customElement('account-page')
export class AccountPage extends LitElement {
  @state() private theme: ThemeName = Theme.current;
  @state() private palette: string = Theme.state.palette ?? 'titi';
  @state() private custom = colorsOf(Theme.state);
  private saveTimer?: number;
  @state() private savingData = false;
  @state() private savingPassword = false;
  @state() private errors: Record<string, string> = {};
  @state() private tokens: ApiToken[] = [];
  @state() private creatingToken = false;
  /** The token just created: shown in clear once, until the user closes the notice. */
  @state() private newToken: ApiToken | null = null;
  private api = GlobalConfig.getInstance().apiUrl;

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this.loadTokens();
  }

  private async loadTokens() {
    try {
      this.tokens = (await axios.get<ApiToken[]>(this.api + 'auth/me/tokens')).data;
    } catch {
      toast(I18n.t('account.tokens.load_error'), 'error');
    }
  }

  private async createToken(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = String(new FormData(form).get('token_name')).trim();
    if (!name) return;
    this.creatingToken = true;
    try {
      this.newToken = (await axios.post<ApiToken>(this.api + 'auth/me/tokens', { name })).data;
      form.reset();
      await this.loadTokens();
    } catch (err) {
      toast(this.message(err, 'crud.save_error'), 'error');
    } finally {
      this.creatingToken = false;
    }
  }

  private async copyToken() {
    try {
      await navigator.clipboard.writeText(this.newToken?.token ?? '');
      toast(I18n.t('account.tokens.copied'), 'success');
    } catch {
      this.querySelector<HTMLInputElement>('#new-token')?.select();   // no clipboard access (http): leave it selected
    }
  }

  private async revokeToken(t: ApiToken) {
    if (!(await confirmDialog(I18n.t('account.tokens.revoke_confirm', t.name), { danger: true, okLabel: I18n.t('account.tokens.revoke') }))) return;
    try {
      await axios.delete(this.api + `auth/me/tokens/${t.id}`);
      if (this.newToken?.id === t.id) this.newToken = null;
      toast(I18n.t('account.tokens.revoked'), 'success');
      await this.loadTokens();
    } catch (err) {
      toast(this.message(err, 'crud.delete_error'), 'error');
    }
  }

  private tokensSection() {
    return html`
      ${this.newToken ? html`
        <div class="mb-6 rounded-2xl border-2 border-accent-500 bg-accent-50 p-5" role="status">
          <p class="font-semibold text-slate-900">${I18n.t('account.tokens.created_title')}</p>
          <p class="mt-1 text-sm text-slate-600">${I18n.t('account.tokens.created_help')}</p>
          <div class="mt-4 flex flex-wrap gap-3">
            <input id="new-token" readonly .value=${this.newToken.token ?? ''} @focus=${(e: Event) => (e.target as HTMLInputElement).select()}
                   class="${ui.input} min-w-0 flex-1 font-mono text-sm" />
            <button type="button" class=${btn('primary')} @click=${this.copyToken}>${icon('clipboard', 'size-4')}${I18n.t('account.tokens.copy')}</button>
            <button type="button" class=${btn('secondary')} @click=${() => { this.newToken = null; }}>${I18n.t('account.tokens.done')}</button>
          </div>
        </div>` : ''}

      <form class="flex flex-wrap items-end gap-3" @submit=${this.createToken}>
        <div class="min-w-[16rem] flex-1">
          <label for="token_name" class=${ui.label}>${I18n.t('account.tokens.name')}</label>
          <input id="token_name" name="token_name" required maxlength="64" autocomplete="off" placeholder=${I18n.t('account.tokens.name_placeholder')} class=${ui.input} />
        </div>
        <button type="submit" class=${btn('primary')} ?disabled=${this.creatingToken}>${icon('key', 'size-4')}${I18n.t(this.creatingToken ? 'account.tokens.creating' : 'account.tokens.create')}</button>
      </form>

      ${this.tokens.length === 0
        ? html`<p class="mt-6 text-sm text-slate-500">${I18n.t('account.tokens.empty')}</p>`
        : html`
          <ul class="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            ${this.tokens.map(t => html`
              <li class="flex flex-wrap items-center gap-4 px-5 py-4">
                <span class="flex size-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">${icon('key', 'size-5')}</span>
                <span class="min-w-0 flex-1">
                  <span class="block font-semibold text-slate-900">${t.name} <span class="ml-1 font-mono text-xs font-normal text-slate-500">${t.prefix}…</span></span>
                  <span class="block text-sm text-slate-500">
                    ${I18n.t('account.tokens.created_at', formatDateTimeString(t.created_at))} ·
                    ${t.last_used_at ? I18n.t('account.tokens.last_used', formatDateTimeString(t.last_used_at)) : I18n.t('account.tokens.never_used')}
                  </span>
                </span>
                <button type="button" class=${btn('danger')} @click=${() => this.revokeToken(t)}>${icon('trash', 'size-4')}${I18n.t('account.tokens.revoke')}</button>
              </li>`)}
          </ul>`}`;
  }

  private message(err: any, fallback: string) {
    const d = err.response?.data?.detail;
    return typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: any) => x.msg).join(' · ') : I18n.t(fallback);
  }

  private async saveData(e: SubmitEvent) {
    e.preventDefault();
    const f = new FormData(e.target as HTMLFormElement);
    this.savingData = true;
    try {
      const { data } = await axios.put(this.api + 'auth/me', { name: String(f.get('name')).trim(), email: String(f.get('email')).trim() || null });
      SessionStatus.getInstance().updateUser(data.user);
      toast(I18n.t('account.data_saved'), 'success');
    } catch (err) {
      toast(this.message(err, 'crud.save_error'), 'error');
    } finally {
      this.savingData = false;
    }
  }

  private async setTheme(theme: ThemeName) {
    if (theme === this.theme) return;
    this.theme = theme;
    try { await Theme.save({ theme }); } catch { toast(I18n.t('theme.save_error'), 'error'); }
  }

  private async setPalette(id: string) {
    this.palette = id;
    this.custom = colorsOf({ palette: id });
    try { await Theme.save({ palette: id }); } catch { toast(I18n.t('theme.save_error'), 'error'); }
  }

  /** Own colors: applied while the picker moves, saved shortly after it stops. */
  private setCustom(which: 'brand' | 'accent', value: string) {
    this.custom = { ...this.custom, [which]: value };
    this.palette = 'custom';
    const change = { palette: 'custom', brand: this.custom.brand, accent: this.custom.accent };
    Theme.apply(change);
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => Theme.save(change).catch(() => toast(I18n.t('theme.save_error'), 'error')), 500);
  }

  private setLanguage(lang: string) {
    if (lang === I18n.lang) return;
    I18n.setLanguage(lang);
    window.location.reload();
  }

  private async changePassword(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const f = new FormData(form);
    const next = String(f.get('new_password')), confirm = String(f.get('confirm_password'));
    this.errors = {};
    if (next.length < 6) { this.errors = { new_password: I18n.t('account.password_short') }; return; }
    if (next !== confirm) { this.errors = { confirm_password: I18n.t('account.password_mismatch') }; return; }
    this.savingPassword = true;
    try {
      await axios.put(this.api + 'auth/me/password', { current_password: String(f.get('current_password')), new_password: next });
      form.reset();
      toast(I18n.t('account.password_changed'), 'success');
    } catch (err) {
      this.errors = { current_password: this.message(err, 'crud.save_error') };
    } finally {
      this.savingPassword = false;
    }
  }

  private field(name: string, label: string, opts: { type?: string; value?: string; disabled?: boolean; autocomplete?: string; help?: string } = {}) {
    const err = this.errors[name];
    return html`
      <div>
        <label for=${name} class=${ui.label}>${label}</label>
        <input id=${name} name=${name} type=${opts.type ?? 'text'} .value=${opts.value ?? ''} ?disabled=${opts.disabled} autocomplete=${opts.autocomplete ?? 'off'}
               class="${ui.input} ${err ? 'border-red-400' : ''}" />
        ${opts.help ? html`<p class="mt-1 text-xs text-slate-500">${opts.help}</p>` : ''}
        ${err ? html`<p class="mt-1 text-xs text-red-600" role="alert">${err}</p>` : ''}
      </div>`;
  }

  private section(title: string, text: string, body: unknown) {
    return html`
      <section class="grid gap-6 border-b border-slate-200 py-10 last:border-b-0 lg:grid-cols-[18rem_1fr]">
        <div>
          <h2 class="font-display text-3xl font-semibold uppercase tracking-tight text-slate-900">${title}</h2>
          <p class="mt-2 text-[15px] text-slate-500">${text}</p>
        </div>
        <div>${body}</div>
      </section>`;
  }

  /** Miniature of the panel in each theme, so the choice is visual. */
  private themeCard(theme: ThemeName) {
    const selected = this.theme === theme;
    const c = theme === 'dark'
      ? { page: '#0d1117', side: '#010409', card: '#161b22', line: '#30363d', text: '#e6edf3', muted: '#6e7681' }
      : { page: '#f4f6f9', side: '#ffffff', card: '#ffffff', line: '#e3e8ef', text: '#0f172a', muted: '#94a0b2' };
    return html`
      <button type="button" role="radio" aria-checked=${selected} @click=${() => this.setTheme(theme)}
              class="group w-64 rounded-[20px] border-2 p-3 text-left transition-colors ${selected ? 'border-brand-500' : 'border-slate-200 hover:border-slate-400'}">
        <span class="flex aspect-[16/10] overflow-hidden rounded-xl border" style="background:${c.page};border-color:${c.line}" aria-hidden="true">
          <span class="w-1/4 border-r p-2" style="background:${c.side};border-color:${c.line}">
            <span class="block size-3 rounded-full bg-accent-500"></span>
            <span class="mt-2 block h-1.5 w-4/5 rounded" style="background:${c.muted}"></span>
            <span class="mt-1.5 block h-1.5 w-3/5 rounded" style="background:${c.muted}"></span>
          </span>
          <span class="flex-1 p-2.5">
            <span class="block h-2.5 w-1/2 rounded bg-brand-500"></span>
            <span class="mt-2 grid grid-cols-2 gap-1.5">
              <span class="h-10 rounded-md border" style="background:${c.card};border-color:${c.line}"></span>
              <span class="h-10 rounded-md border" style="background:${c.card};border-color:${c.line}"></span>
            </span>
            <span class="mt-1.5 block h-1.5 w-2/3 rounded" style="background:${c.text}"></span>
          </span>
        </span>
        <span class="mt-3 flex items-center gap-2 px-1">
          <span class="flex size-5 items-center justify-center rounded-full border-2 ${selected ? 'border-brand-500 bg-brand-500 text-on-primary' : 'border-slate-300'}">${selected ? icon('check', 'size-3') : ''}</span>
          <span class="text-base font-semibold text-slate-900">${I18n.t(`account.theme.${theme}`)}</span>
        </span>
        <span class="mt-1 block px-1 text-sm text-slate-500">${I18n.t(`account.theme.${theme}_help`)}</span>
      </button>`;
  }

  render() {
    const user = SessionStatus.getInstance().user ?? {};
    const name: string = user.name ?? user.login ?? '';
    return html`
      ${titleBand(I18n.t('account.title'), I18n.t('account.signed_as', name, user.login), { icon: 'user' })}

      ${this.section(I18n.t('account.data'), I18n.t('account.data_help'), html`
        <form class="space-y-4" @submit=${this.saveData}>
          ${this.field('login', I18n.t('account.login'), { value: user.login, disabled: true, help: I18n.t('account.login_help') })}
          ${this.field('name', I18n.t('account.name'), { value: user.name, autocomplete: 'name' })}
          ${this.field('email', I18n.t('account.email'), { type: 'email', value: user.email ?? '', autocomplete: 'email' })}
          <button type="submit" class=${btn('primary')} ?disabled=${this.savingData}>${I18n.t(this.savingData ? 'common.saving' : 'account.save_data')}</button>
        </form>`)}

      ${this.section(I18n.t('account.appearance'), I18n.t('account.appearance_help'), html`
        <div class="flex flex-wrap gap-4" role="radiogroup" aria-label=${I18n.t('account.appearance')}>
          ${this.themeCard('light')}${this.themeCard('dark')}
        </div>`)}

      ${this.section(I18n.t('account.colors'), I18n.t('account.colors_help'), html`
        <div class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(11rem,1fr))]" role="radiogroup" aria-label=${I18n.t('account.colors')}>
          ${PALETTES.map(p => html`
            <button type="button" role="radio" aria-checked=${this.palette === p.id} @click=${() => this.setPalette(p.id)}
                    class="flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${this.palette === p.id ? 'border-brand-500' : 'border-slate-200 hover:border-slate-400'}">
              <span class="flex shrink-0" aria-hidden="true">
                <span class="size-8 rounded-full ring-2 ring-surface" style="background:${p.brand}"></span>
                <span class="-ml-3 size-8 rounded-full ring-2 ring-surface" style="background:${p.accent}"></span>
              </span>
              <span class="text-sm font-semibold text-slate-900">${I18n.t(`palette.${p.id}`)}</span>
            </button>`)}
        </div>
        <div class="mt-5 rounded-2xl border-2 p-4 ${this.palette === 'custom' ? 'border-brand-500' : 'border-slate-200'}">
          <p class="text-sm font-semibold text-slate-900">${I18n.t('palette.custom')}</p>
          <p class="mt-1 text-sm text-slate-500">${I18n.t('account.custom_help')}</p>
          <div class="mt-4 flex flex-wrap gap-6">
            ${(['brand', 'accent'] as const).map(which => html`
              <label class="flex cursor-pointer items-center gap-3">
                <input type="color" class="size-11 cursor-pointer rounded-xl border border-slate-300 bg-transparent p-1" .value=${this.custom[which]}
                       @input=${(e: Event) => this.setCustom(which, (e.target as HTMLInputElement).value)} />
                <span>
                  <span class="block text-sm font-medium text-slate-800">${I18n.t(`account.color_${which}`)}</span>
                  <span class="block font-mono text-xs text-slate-500">${this.custom[which]}</span>
                </span>
              </label>`)}
          </div>
        </div>`)}

      ${this.section(I18n.t('account.language'), I18n.t('account.language_help'), html`
        <div class="flex flex-wrap gap-3" role="radiogroup" aria-label=${I18n.t('account.language')}>
          ${Object.entries(I18n.supported).map(([code, label]) => html`
            <button type="button" role="radio" aria-checked=${code === I18n.lang} @click=${() => this.setLanguage(code)}
                    class="rounded-full border-2 px-6 py-2.5 text-base font-semibold transition-colors ${code === I18n.lang ? 'border-brand-500 text-brand-600' : 'border-slate-200 text-slate-700 hover:border-slate-400'}">${label}</button>`)}
        </div>`)}

      ${this.section(I18n.t('account.tokens'), I18n.t('account.tokens_help'), this.tokensSection())}

      ${this.section(I18n.t('account.password'), I18n.t('account.password_help'), html`
        <form class="space-y-4" @submit=${this.changePassword}>
          <input type="text" name="username" autocomplete="username" .value=${user.login ?? ''} hidden />
          ${this.field('current_password', I18n.t('account.current_password'), { type: 'password', autocomplete: 'current-password' })}
          ${this.field('new_password', I18n.t('account.new_password'), { type: 'password', autocomplete: 'new-password', help: I18n.t('account.password_rule') })}
          ${this.field('confirm_password', I18n.t('account.confirm_password'), { type: 'password', autocomplete: 'new-password' })}
          <button type="submit" class=${btn('primary')} ?disabled=${this.savingPassword}>${I18n.t(this.savingPassword ? 'common.saving' : 'account.change_password')}</button>
        </form>`)}`;
  }
}
