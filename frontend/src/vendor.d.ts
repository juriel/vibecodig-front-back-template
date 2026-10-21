// Modules without bundled type declarations.
declare module 'grapesjs/locale/es' {
  const messages: Record<string, any>;
  export default messages;
}
declare module '*.css';
declare module 'js-beautify/js/lib/beautify-html.js' {
  export function html_beautify(source: string, options?: Record<string, unknown>): string;
}
declare module 'js-beautify/js/lib/beautify-css.js' {
  export function css_beautify(source: string, options?: Record<string, unknown>): string;
}
declare module 'monaco-editor/editor/editor.main.js';
