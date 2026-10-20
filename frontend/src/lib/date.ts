const pad = (n: number) => n.toString().padStart(2, '0');

/** Date → "YYYY-MM-DD HH:mm:ss" (local time) */
export function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** ISO string → "YYYY-MM-DD HH:mm" (empty if there is no value). Handy as a Column.renderer. */
export function formatDateTimeString(s?: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
