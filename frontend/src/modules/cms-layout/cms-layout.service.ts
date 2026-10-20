import axios from 'axios';
import { CrudService } from '../../crud/crud-service';
import { GlobalConfig } from '../../global-config';

export interface CmsLayoutDTO {
  id?: number;
  layout_name: string;
  cms_type_layout: string;
  layout_content?: string;
  default_layout?: boolean;
  type_name?: string;
  used_by?: number;
}

export class CmsLayoutService extends CrudService<CmsLayoutDTO> {
  base = GlobalConfig.getInstance().apiUrl + 'cms/layouts';
  getKey = (e: CmsLayoutDTO) => e.id!;

  types = () => axios.get<{ code: string; type_name: string }[]>(this.base + '/types').then(r => r.data);
}
