import { CrudService } from '../../crud/crud-service';
import { GlobalConfig } from '../../global-config';
import { PrivilegeDTO } from '../profile/profile.service';

/** Privilege catalog: read-only (the codes are defined by the platform code). */
export class PrivilegeService extends CrudService<PrivilegeDTO> {
  base = GlobalConfig.getInstance().apiUrl + 'privileges';
  getKey = (e: PrivilegeDTO) => e.code;
}
