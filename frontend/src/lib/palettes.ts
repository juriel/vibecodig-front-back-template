/**
 * Color styles for the panel: a main color (brand) and an accent. Each one was picked so the two work together
 * in both light and dark themes. "titi" (TitiCMS blue + orange) is the default.
 * To add one: append it here and add its name in the i18n catalogs (palette.<id>).
 */
export interface Palette { id: string; brand: string; accent: string }

export const PALETTES: Palette[] = [
  { id: 'titi',   brand: '#1f5fc4', accent: '#f26a10' },   // TitiCMS classic
  { id: 'nexvia', brand: '#2d9b9b', accent: '#2c3e50' },   // NEXVIA site: teal + slate
  { id: 'ocean',  brand: '#0e7490', accent: '#f59e0b' },   // teal + amber
  { id: 'forest', brand: '#166534', accent: '#d97706' },   // green + ochre
  { id: 'grape',  brand: '#6d28d9', accent: '#db2777' },   // violet + pink
  { id: 'ruby',   brand: '#b91c1c', accent: '#0f766e' },   // red + teal
  { id: 'slate',  brand: '#334155', accent: '#0ea5e9' },   // graphite + sky
];

export const DEFAULT_PALETTE = PALETTES[0];

const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const hex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

/** WCAG relative luminance. */
function luminance(h: string): number {
  const [r, g, b] = rgb(h).map(v => v / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** White or dark text, whichever has more contrast on `h`. */
export function textOn(h: string): string {
  return contrast(h, '#ffffff') >= contrast(h, '#0f172a') ? '#ffffff' : '#0f172a';
}

/**
 * The same hue, darkened (on a light background) or lightened (on a dark one) just enough to be readable as text
 * (contrast ≥ 4.5, WCAG AA). Colors that already are readable come back unchanged.
 */
export function readableOn(h: string, background: string, min = 4.5): string {
  const towards = luminance(background) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  const base = rgb(h);
  for (let t = 0; t <= 1; t += 0.04) {
    const c = hex(base.map((v, i) => v + (towards[i] - v) * t));
    if (contrast(c, background) >= min) return c;
  }
  return hex(towards);
}
