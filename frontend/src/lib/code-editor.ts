import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import axios from 'axios';
import type * as Monaco from 'monaco-editor';
import { GlobalConfig } from '../global-config';
import { Theme } from './theme';
import { I18n } from './i18n';

export type CodeLanguage = 'html' | 'css' | 'javascript';

/**
 * VS Code's editor (Monaco) on top of a form <textarea>: the textarea stays the source of truth for the form
 * (FormData, repopulate, the visual editor), the editor mirrors it both ways. Monaco loads on first use, in its own chunk.
 *
 * Usage: <code-editor for="page_content" language="html"></code-editor> right after <textarea id="page_content">.
 * Also offers AI suggestions (gray "ghost text", Tab accepts) when the assistant is configured on the server.
 */
@customElement('code-editor')
export class CodeEditor extends LitElement {
  @property() for = '';
  @property() language: CodeLanguage = 'html';
  @property({ type: Number }) rows = 12;

  private editor?: Monaco.editor.IStandaloneCodeEditor;
  private textarea?: HTMLTextAreaElement | null;
  private syncing = false;
  private onTheme = () => monaco?.editor.setTheme(Theme.current === 'dark' ? 'vs-dark' : 'vs');
  private onTextarea = () => {
    if (this.syncing || !this.editor || !this.textarea) return;
    if (this.editor.getValue() !== this.textarea.value) this.editor.setValue(this.textarea.value);
  };

  createRenderRoot() { return this; }

  async firstUpdated() {
    this.textarea = this.closest('form, div')?.querySelector<HTMLTextAreaElement>(`#${CSS.escape(this.for)}`) ?? null;
    if (!this.textarea) return;
    const m = await loadMonaco();
    const host = this.querySelector<HTMLElement>('.code-host')!;
    this.editor = m.editor.create(host, {
      value: this.textarea.value,
      language: this.language,
      theme: Theme.current === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbersMinChars: 3,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      inlineSuggest: { enabled: true },
      quickSuggestions: { other: true, comments: false, strings: true },
      fixedOverflowWidgets: true,
    });
    // the textarea is hidden but keeps the value the form submits
    this.textarea.classList.add('sr-only');
    this.textarea.tabIndex = -1;
    this.editor.onDidChangeModelContent(() => {
      this.syncing = true;
      this.textarea!.value = this.editor!.getValue();
      this.textarea!.dispatchEvent(new Event('input', { bubbles: true }));
      this.syncing = false;
    });
    this.textarea.addEventListener('input', this.onTextarea);
    window.addEventListener('theme-change', this.onTheme);
  }

  disconnectedCallback() {
    this.textarea?.removeEventListener('input', this.onTextarea);
    window.removeEventListener('theme-change', this.onTheme);
    this.editor?.dispose();
    super.disconnectedCallback();
  }

  render() {
    return html`<div class="code-host overflow-hidden rounded-xl border border-slate-300" style="height:${Math.max(160, this.rows * 20)}px"
                     aria-label=${I18n.t('editor.code_area')}></div>`;
  }
}

let monaco: typeof Monaco | undefined;
let loading: Promise<typeof Monaco> | undefined;

/** Loads Monaco once (lazy chunk), wires its web workers and registers the AI inline suggestions. */
function loadMonaco(): Promise<typeof Monaco> {
  loading ??= (async () => {
    (self as any).MonacoEnvironment = {
      getWorker(_: string, label: string) {
        if (label === 'html' || label === 'handlebars' || label === 'razor')
          return new Worker(new URL('monaco-editor/languages/features/html/html.worker.js', import.meta.url), { type: 'module' });
        if (label === 'css' || label === 'scss' || label === 'less')
          return new Worker(new URL('monaco-editor/languages/features/css/css.worker.js', import.meta.url), { type: 'module' });
        if (label === 'typescript' || label === 'javascript')
          return new Worker(new URL('monaco-editor/languages/features/typescript/ts.worker.js', import.meta.url), { type: 'module' });
        return new Worker(new URL('monaco-editor/editor/editor.worker.js', import.meta.url), { type: 'module' });
      },
    };
    const m = await import(/* webpackChunkName: "monaco" */ 'monaco-editor/editor/editor.main.js') as typeof Monaco;
    monaco = m;
    registerAiSuggestions(m);
    return m;
  })();
  return loading;
}

/**
 * AI suggestions as gray inline text (accepted with Tab), like Copilot. Asked only after a short pause in typing,
 * and turned off for the session if the server says the assistant is not configured.
 */
function registerAiSuggestions(m: typeof Monaco) {
  let available: boolean | undefined;
  const api = GlobalConfig.getInstance().apiUrl;
  const provider: Monaco.languages.InlineCompletionsProvider = {
    async provideInlineCompletions(model, position, _context, token) {
      if (available === undefined) available = await axios.get(api + 'ai/status').then(r => !!r.data.enabled).catch(() => false);
      if (!available) return { items: [] };
      await new Promise(r => setTimeout(r, 450));                    // wait for a pause in typing
      if (token.isCancellationRequested) return { items: [] };
      const offset = model.getOffsetAt(position), full = model.getValue();
      const language = model.getLanguageId() as CodeLanguage;
      try {
        const { data } = await axios.post(api + 'ai/complete', {
          language: ['html', 'css', 'javascript'].includes(language) ? language : 'html',
          before: full.slice(Math.max(0, offset - 5000), offset),
          after: full.slice(offset, offset + 1500),
        });
        if (token.isCancellationRequested || !data.text) return { items: [] };
        return { items: [{ insertText: data.text, range: new m.Range(position.lineNumber, position.column, position.lineNumber, position.column) }] };
      } catch (err: any) {
        if (err.response?.status === 503) available = false;          // not configured / bad key: stop asking
        return { items: [] };
      }
    },
    disposeInlineCompletions() { /* nothing to free */ },
  };
  for (const lang of ['html', 'css', 'javascript']) m.languages.registerInlineCompletionsProvider(lang, provider);
}
