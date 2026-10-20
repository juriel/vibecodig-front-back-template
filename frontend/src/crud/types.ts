export interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'checkbox';
  options?: Record<string, string>;   // para select: { value: label }
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
