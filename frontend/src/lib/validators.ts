/** Validadores de string reutilizables; compatibles con FormField.validator: (v) => boolean */
export const isEmpty = (v?: string | any[] | null): boolean =>
  v == null || (typeof v === 'string' ? v.trim().length === 0 : v.length === 0);
export const isNotEmpty = (v?: string | any[] | null) => !isEmpty(v);
export const minLength = (n: number) => (v: string) => !!v && v.trim().length >= n;
export const maxLength = (n: number) => (v: string) => !!v && v.trim().length <= n;

export const hasLower = (s: string) => /[a-z]/.test(s);
export const hasUpper = (s: string) => /[A-Z]/.test(s);
export const hasDigit = (s: string) => /[0-9]/.test(s);
export const hasSpecial = (s: string) => /[^a-zA-Z0-9]/.test(s);
export const isAlphanumeric = (s: string) => /^[a-zA-Z0-9]+$/.test(s);
export const isCode = (s: string) => /^[a-zA-Z0-9_]+$/.test(s);
export const isEnvVarName = (s: string) => /^[A-Z_][A-Z0-9_]*$/.test(s);
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** Contraseña fuerte: 8+ caracteres, mayúscula, minúscula, número y especial. */
export const isStrongPassword = (s: string) =>
  !!s && s.length >= 8 && hasLower(s) && hasUpper(s) && hasDigit(s) && hasSpecial(s);

/** Timestamp de expiración (ms) aún vigente. */
export const isTokenValid = (expiresAtMs: number) => expiresAtMs >= Date.now();
