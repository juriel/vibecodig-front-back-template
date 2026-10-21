import { CrudService } from '../../crud/crud-service';
import { GlobalConfig } from '../../global-config';

export interface CmsRedirectDTO {
  id?: number;
  source: string;
  target: string;
  status_code: number | string;
  active?: boolean;
}

export class CmsRedirectService extends CrudService<CmsRedirectDTO> {
  base = GlobalConfig.getInstance().apiUrl + 'cms/redirects';
  getKey = (e: CmsRedirectDTO) => e.id!;
}
