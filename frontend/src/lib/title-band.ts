import { html, TemplateResult } from 'lit';
import { icon } from './icons';

/**
 * Screen header in the TitiCMS style: a blue band with the icon, the title in white and the actions on the right.
 * Used by every CRUD screen and by "My account", so all screens open the same way.
 */
export function titleBand(title: string, subtitle: string, opts: { icon?: string; actions?: unknown } = {}): TemplateResult {
  return html`
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-brand-500 px-6 py-5 text-on-primary md:px-8">
      <div class="flex min-w-0 items-center gap-4">
        ${opts.icon ? html`<span class="on-primary-soft flex size-12 shrink-0 items-center justify-center rounded-2xl">${icon(opts.icon, 'size-7')}</span>` : ''}
        <div class="min-w-0">
          <h1 class="truncate font-display text-4xl font-semibold uppercase leading-none tracking-tight md:text-5xl">${title}</h1>
          <p class="mt-1.5 text-sm opacity-80">${subtitle}</p>
        </div>
      </div>
      ${opts.actions ? html`<div class="flex flex-wrap gap-2">${opts.actions}</div>` : ''}
    </div>`;
}

/** Buttons that sit on the blue band: "New" in TitiCMS orange, secondary ones translucent white. */
export const bandBtn = {
  accent: 'inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-on-accent shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-white/30',
  ghost: 'on-primary-soft on-primary-soft-hover inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-on-primary transition focus:outline-none focus:ring-4 focus:ring-white/30',
};
