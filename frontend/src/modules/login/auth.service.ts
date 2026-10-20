import axios from 'axios';
import { GlobalConfig } from '../../global-config';

export interface LoginDTO { login: string; password: string; }
export interface SessionDTO { token: string; user: any; privileges: string[]; }

export const AuthService = {
  login: (dto: LoginDTO) =>
    axios.post<SessionDTO>(GlobalConfig.getInstance().apiUrl + 'auth/login', dto).then(r => r.data),
};
