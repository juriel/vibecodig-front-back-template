import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlobalConfig } from '../../global-config';
import { SessionStatus } from '../../lib/session';

@customElement('home-page')
export class HomePage extends LitElement {
  createRenderRoot() { return this; }
  render() {
    const user = SessionStatus.getInstance().user;
    return html`
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Hola${user ? `, ${user.name ?? user.login}` : ''} 👋</h1>
      <p class="mt-1 text-slate-500">Bienvenido al panel de ${GlobalConfig.getInstance().appName}.</p>`;
  }
}
