import axios from 'axios';
import { GlobalConfig } from '../global-config';
import { DEFAULT_PALETTE, PALETTES, readableOn, textOn } from './palettes';

export type ThemeName = 'light' | 'dark';

/** The user's appearance: light/dark theme and colors (a preset, or "custom" with their own two colors). */
export interface Appearance { theme?: ThemeName; palette?: string | null; brand?: string | null; accent?: string | null }

const KEY = 'appearance';

/** Base colors of an appearance: the chosen preset, the user's own pair, or TitiCMS. */
export function colorsOf(a: Appearance): { brand: string; accent: string } {
  if (a.palette === 'custom' && a.brand && a.accent) return { brand: a.brand, accent: a.accent };
  const preset = PALETTES.find(p => p.id === a.palette) ?? DEFAULT_PALETTE;
  return { brand: preset.brand, accent: preset.accent };
}

/**
 * Panel appearance. It belongs to the user account (PUT /auth/me/preferences, returned by the login and /auth/me);
 * localStorage only keeps the last one used on this computer, so index.html can paint it before the app loads.
 */
export const Theme = {
  state: {} as Appearance,

  get current(): ThemeName {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  },

  apply(a: Appearance | undefined) {
    const next: Appearance = { ...this.state, ...(a ?? {}) };
    next.theme = next.theme === 'dark' ? 'dark' : 'light';
    this.state = next;
    const root = document.documentElement;
    const { brand, accent } = colorsOf(next);
    // Bands and buttons use the colors as chosen; as text they get a version readable on the page background.
    const vars = {
      'brand-base': brand, 'accent-base': accent, 'color-on-primary': textOn(brand), 'color-on-accent': textOn(accent),
      'brand-ink': readableOn(brand, '#f4f6f9'), 'accent-ink': readableOn(accent, '#f4f6f9'),
      'brand-ink-dark': readableOn(brand, '#161b22'), 'accent-ink-dark': readableOn(accent, '#161b22'),
    };
    root.dataset.theme = next.theme;
    for (const [k, v] of Object.entries(vars)) root.style.setProperty('--' + k, v);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next.theme === 'dark' ? '#0d1117' : '#f4f6f9');
    try { localStorage.setItem(KEY, JSON.stringify({ ...next, ...vars })); } catch { /* private mode: the account still keeps it */ }
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
  },

  /** Applies the change right away and saves it in the user's account (only the fields given). */
  async save(change: Appearance) {
    this.apply(change);
    await axios.put(GlobalConfig.getInstance().apiUrl + 'auth/me/preferences', change);
  },
};

// Start from what index.html already painted (last appearance on this computer).
try { Theme.state = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { Theme.state = {}; }
