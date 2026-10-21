/** Shared Tailwind classes so every component looks the same. */
export const ui = {
  input: 'block w-full rounded-xl border border-slate-300 bg-raised px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:bg-slate-100 disabled:text-slate-500',
  label: 'mb-1.5 block text-sm font-medium text-slate-700',
  btn: 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50',
  // Primary = solid TitiCMS blue pill.
  primary: 'bg-brand-500 text-on-primary shadow-sm hover:brightness-110 focus:ring-brand-500/30',
  secondary: 'border border-slate-300 bg-transparent text-slate-800 hover:border-slate-500 hover:bg-raised focus:ring-slate-300/40',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/30',
  card: 'rounded-[20px] border border-slate-200 bg-surface',
  iconBtn: 'inline-flex size-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-raised hover:text-brand-700',
};
export const btn = (variant: 'primary' | 'secondary' | 'danger') => `${ui.btn} ${ui[variant]}`;
