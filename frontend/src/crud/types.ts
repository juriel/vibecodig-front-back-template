export interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'checkbox' | 'checkboxes';
  options?: Record<string, string>;   // para select / checkboxes: { value: label } (checkboxes → el valor es un array)
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
