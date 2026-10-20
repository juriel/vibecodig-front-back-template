import { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Lightweight i18n backed by .properties files (`key=value`, `#` comments, `{0}` placeholders).
 * The catalog is shared with the backend: frontend/web/assets/i18n/<lang>.properties.
 * Language order: localStorage > browser language > default. The default language is always loaded as the fallback.
 * Usage: await I18n.init('en'); I18n.t('greeting', 'Ana')  // "Hello {0}"
 */
export class I18n {
  /** Languages with a catalog. Add the file and the code here to support a new one. */
  static readonly supported: Record<string, string> = { en: 'English', es: 'Español' };

  private static active = new Map<string, string>();
  private static fallback = new Map<string, string>();
  private static events = new EventTarget();
  private static path = '/assets/i18n/';
  private static defaultLang = 'en';
  static lang = 'en';

  static async init(defaultLang: string, path = '/assets/i18n/'): Promise<void> {
    this.defaultLang = defaultLang;
    this.path = path.endsWith('/') ? path : path + '/';
    const stored = localStorage.getItem('i18n');
    const browser = navigator.language?.split('-')[0];
    this.lang = [stored, browser].find(l => !!l && l in this.supported) ?? defaultLang;
    document.documentElement.lang = this.lang;
    await this.load(defaultLang, this.fallback);
    if (this.lang !== defaultLang) await this.load(this.lang, this.active);
    this.events.dispatchEvent(new Event('lang-change'));
  }

  /** Stores the language. The caller reloads the page so every view is rendered again in the new language. */
  static setLanguage(lang: string): void {
    if (lang in this.supported) localStorage.setItem('i18n', lang);
  }

  static t(key: string, ...args: any[]): string {
    const val = this.active.get(key) ?? this.fallback.get(key);
    if (val === undefined) return key;
    return val.replace(/{(\d+)}/g, (m, i) => (args[+i] !== undefined ? args[+i] : m));
  }

  /** Plural-aware translation: uses `<key>.one` when n === 1, otherwise `<key>.other`; `{0}` is n. */
  static tn(key: string, n: number, ...args: any[]): string {
    return this.t(`${key}.${n === 1 ? 'one' : 'other'}`, n, ...args);
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
      console.error(`[I18n] error loading ${lang}`, e);
    }
  }

  static subscribe(cb: () => void): () => void {
    this.events.addEventListener('lang-change', cb);
    return () => this.events.removeEventListener('lang-change', cb);
  }
}

/** Lit controller: re-renders the host when the language changes. Usage: `private _i18n = new I18nController(this);` */
export class I18nController implements ReactiveController {
  private off?: () => void;
  constructor(private host: ReactiveControllerHost) { host.addController(this); }
  hostConnected() { this.off = I18n.subscribe(() => this.host.requestUpdate()); }
  hostDisconnected() { this.off?.(); }
}
