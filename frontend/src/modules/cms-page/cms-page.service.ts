import axios from 'axios';
import { CrudService } from '../../crud/crud-service';
import { GlobalConfig } from '../../global-config';

export interface CmsPageDTO {
  id?: number;
  cms_layout: number | string;
  url: string;
  title: string;
  subtitle?: string | null;
  keywords?: string | null;
  page_content?: string;
  css?: string;
  javascript?: string;
  is_index?: boolean;
  // SEO
  description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  canonical?: string | null;
  noindex?: boolean;
  // read-only (list)
  layout_name?: string;
  owner?: string;
  owner_name?: string;
  last_update_date?: string;
}

export class CmsPageService extends CrudService<CmsPageDTO> {
  base = GlobalConfig.getInstance().apiUrl + 'cms/pages';
  getKey = (e: CmsPageDTO) => e.id!;

  /** Layouts for the selector. */
  layouts = () => axios.get<{ id: number; layout_name: string }[]>(this.base + '/layouts').then(r => r.data);
}
