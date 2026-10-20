import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MessageBroker } from '../crud/broker';
import { AuthService } from './auth-service';
import { APP_NAME } from '../admin-menu';

@customElement('login-page')
export class LoginPage extends LitElement {
  @state() private error = '';
  @state() private sending = false;

  createRenderRoot() { return this; }

  private async _submit(e: SubmitEvent) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    this.sending = true;
    this.error = '';
    try {
      const user = await AuthService.login(String(data.get('login')), String(data.get('password')));
      MessageBroker.publish('auth-login', { user });
    } catch (err: any) {
      this.error = err.response?.data?.detail ?? 'No se pudo conectar con el servidor';
    } finally {
      this.sending = false;
    }
  }

  render() {
    return html`
      <div class="login-wrap">
        <form class="login-card" @submit="${this._submit}">
          <h1>${APP_NAME}</h1>
          <p class="login-subtitle">Inicia sesión para continuar</p>
          ${this.error ? html`<p class="error-global">${this.error}</p>` : ''}
          <div class="form-group">
            <label for="login">Usuario</label>
            <input id="login" name="login" autocomplete="username" required autofocus />
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button type="submit" ?disabled="${this.sending}">${this.sending ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>`;
  }
}
