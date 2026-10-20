import { CrudService } from '../../crud/crud-service';
import { GlobalConfig } from '../../global-config';

export interface CmsWidgetDTO {
  id?: number;
  name: string;
  value?: string;
  used_in_layouts?: number;
  used_in_pages?: number;
}

export class CmsWidgetService extends CrudService<CmsWidgetDTO> {
  base = GlobalConfig.getInstance().apiUrl + 'cms/widgets';
  getKey = (e: CmsWidgetDTO) => e.id!;
}
