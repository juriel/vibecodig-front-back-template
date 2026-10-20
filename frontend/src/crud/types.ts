export interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'checkbox' | 'checkboxes';
  options?: Record<string, string>;   // for select / checkboxes: { value: label } (checkboxes → the value is an array)
  groups?: Record<string, Record<string, string>>;  // checkboxes agrupados: { grupo: { value: label } } (reemplaza a options)
  rows?: number;            // textarea: filas visibles (default 4)
  mono?: boolean;           // textarea: monospaced font, no spellcheck (for HTML/CSS/JS)
  placeholder?: string;
  help?: string;            // help text below the field
  required?: boolean;
  disabled?: boolean;
  zone?: 'top' | 'left' | 'right' | 'bottom'; // layout TLRB, default: top
  validator?: (value: any) => boolean;
}

export interface Column<T> {
  key: string;                                  // soporta dot notation: 'user.name'
  label: string;
  renderer?: (item: T) => any;
  slice?: number;                               // truncar texto largo
}
