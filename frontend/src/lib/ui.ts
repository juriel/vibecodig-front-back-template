/** Shared Tailwind classes so every component looks the same. */
export const ui = {
  input: 'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:bg-slate-100 disabled:text-slate-500',
  label: 'mb-1.5 block text-sm font-medium text-slate-700',
  btn: 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50',
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus:ring-brand-500/30',
  secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-slate-300/40',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500/30',
  card: 'rounded-xl border border-slate-200 bg-white shadow-card',
  iconBtn: 'inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-brand-600',
};
export const btn = (variant: 'primary' | 'secondary' | 'danger') => `${ui.btn} ${ui[variant]}`;
