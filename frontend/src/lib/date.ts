const pad = (n: number) => n.toString().padStart(2, '0');

/** Date → "YYYY-MM-DD HH:mm:ss" (hora local) */
export function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** String ISO → "YYYY-MM-DD HH:mm" (vacío si no hay valor). Útil como Column.renderer. */
export function formatDateTimeString(s?: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
