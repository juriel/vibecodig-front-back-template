import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ExampleService, ExampleDTO } from './example-service';

@customElement('example-page')
export class ExamplePage extends LitElement {
  @state() items: ExampleDTO[] = [];
  @state() loading = false;

  static styles = css`
    :host { display: block; padding: 1rem; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  async load() {
    this.loading = true;
    this.items = await ExampleService.findAll();
    this.loading = false;
  }

  render() {
    if (this.loading) return html`<p>Cargando...</p>`;
    return html`
      <h2>Example</h2>
      <ul>
        ${this.items.map(i => html`<li>${i.name}</li>`)}
      </ul>
    `;
  }
}
