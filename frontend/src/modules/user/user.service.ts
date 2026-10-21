import axios from 'axios';
import { CrudService } from '../../crud/crud-service';
import { GlobalConfig } from '../../global-config';

export interface UserDTO {
  login: string;
  name: string;
  email?: string | null;
  password?: string;
  profile_ids?: number[];
  profiles?: { id: number; name: string; super?: boolean }[];
}

export class UserService extends CrudService<UserDTO> {
  base = GlobalConfig.getInstance().apiUrl + 'users';
  getKey = (e: UserDTO) => e.login;

  /** Profiles the current user can assign. */
  profiles = () => axios.get<{ id: number; name: string }[]>(this.base + '/profiles').then(r => r.data);
}
