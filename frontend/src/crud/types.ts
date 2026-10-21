export interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'checkbox' | 'checkboxes';
  options?: Record<string, string>;   // for select / checkboxes: { value: label } (checkboxes → the value is an array)
  groups?: Record<string, Record<string, string>>;  // checkboxes agrupados: { grupo: { value: label } } (reemplaza a options)
  rows?: number;            // textarea: filas visibles (default 4)
  mono?: boolean;           // textarea: code → VS Code-like editor (lib/code-editor.ts) over the textarea
  language?: 'html' | 'css' | 'javascript';  // code language of a mono textarea (default html)
  placeholder?: string;
  help?: string;            // help text below the field
  default?: string | number | boolean;   // initial value on new records (checkbox: checked)
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
