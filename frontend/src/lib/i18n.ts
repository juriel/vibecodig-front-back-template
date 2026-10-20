import { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * i18n ligero con archivos .properties (key=value, # comentarios).
 * Orden de idioma: localStorage > idioma del navegador > default. Siempre carga el default como fallback.
 * Uso: await I18n.init('es'); I18n.t('saludo', 'Ana')  // "Hola {0}"
 * Archivos en frontend/web/assets/i18n/<lang>.properties
 */
export class I18n {
  private static active = new Map<string, string>();
  private static fallback = new Map<string, string>();
  private static events = new EventTarget();
  private static path = '/assets/i18n/';
  private static defaultLang = 'es';
  static lang = 'es';

  static async init(defaultLang: string, path = '/assets/i18n/'): Promise<void> {
    this.defaultLang = defaultLang;
    this.path = path.endsWith('/') ? path : path + '/';
    this.lang = localStorage.getItem('i18n') || navigator.language?.split('-')[0] || defaultLang;
    await this.load(defaultLang, this.fallback);
    if (this.lang !== defaultLang) await this.load(this.lang, this.active);
    this.events.dispatchEvent(new Event('lang-change'));
  }

  static async setLanguage(lang: string): Promise<void> {
    this.lang = lang;
    localStorage.setItem('i18n', lang);
    if (lang === this.defaultLang) this.active.clear();
    else await this.load(lang, this.active);
    this.events.dispatchEvent(new Event('lang-change'));
  }

  static t(key: string, ...args: any[]): string {
    const val = this.active.get(key) ?? this.fallback.get(key);
    if (val === undefined) return key;
    return val.replace(/{(\d+)}/g, (m, i) => (args[+i] !== undefined ? args[+i] : m));
  }

  private static async load(lang: string, target: Map<string, string>) {
    target.clear();
    try {
      const res = await fetch(`${this.path}${lang}.properties`);
      if (!res.ok) return;
      for (const line of (await res.text()).split('\n')) {
        const l = line.trim();
        if (!l || l.startsWith('#') || l.startsWith('!')) continue;
        const i = l.indexOf('=');
        if (i > 0) target.set(l.slice(0, i).trim(), l.slice(i + 1).trim());
      }
    } catch (e) {
      console.error(`[I18n] error cargando ${lang}`, e);
    }
  }

  static subscribe(cb: () => void): () => void {
    this.events.addEventListener('lang-change', cb);
    return () => this.events.removeEventListener('lang-change', cb);
  }
}

/** Controller Lit: re-renderiza el componente al cambiar el idioma. Uso: `private _i18n = new I18nController(this);` */
export class I18nController implements ReactiveController {
  private off?: () => void;
  constructor(private host: ReactiveControllerHost) { host.addController(this); }
  hostConnected() { this.off = I18n.subscribe(() => this.host.requestUpdate()); }
  hostDisconnected() { this.off?.(); }
}
