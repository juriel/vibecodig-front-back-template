import axios from 'axios';
import { CrudService } from '../../crud/crud-service';
import { GlobalConfig } from '../../global-config';

export interface ProfileDTO {
  id?: number;
  name: string;
  editable?: boolean;
  privilege_codes?: string[];
}

export interface PrivilegeDTO {
  code: string;
  description: string;
  category: string;
}

export class ProfileService extends CrudService<ProfileDTO> {
  base = GlobalConfig.getInstance().apiUrl + 'profiles';
  getKey = (e: ProfileDTO) => e.id!;

  /** Privileges the current user can grant. */
  privileges = () => axios.get<PrivilegeDTO[]>(this.base + '/privileges').then(r => r.data);
}
