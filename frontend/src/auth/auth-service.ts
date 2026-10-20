import axios from 'axios';
import { GlobalConfig } from '../global-config';
import { MessageBroker } from '../crud/broker';

const BASE = GlobalConfig.getInstance().apiUrl + 'auth/';

export interface UserDTO {
  id: number;
  login: string;
  name: string;
}

/** Usuario de la sesión actual (lo asigna app-root al entrar). */
export const session: { user: UserDTO | null } = { user: null };

export const AuthService = {
  me: () => axios.get<UserDTO>(BASE + 'me').then(r => r.data),
  login: (login: string, password: string) => axios.post<UserDTO>(BASE + 'login', { login, password }).then(r => r.data),
  logout: () => axios.post(BASE + 'logout'),
};

// Si la sesión vence durante el uso, cualquier 401 devuelve al login
axios.interceptors.response.use(undefined, err => {
  const url: string = err.config?.url ?? '';
  if (err.response?.status === 401 && !url.startsWith(BASE)) MessageBroker.publish('auth-expired');
  return Promise.reject(err);
});
