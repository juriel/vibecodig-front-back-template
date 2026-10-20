import { customElement } from 'lit/decorators.js';
import { CmsAssetTable } from '../cms-asset/cms-asset';
import { CmsCssService } from './cms-css.service';

@customElement('cms-css-table')
export class CmsCssTable extends CmsAssetTable {
  get prefix() { return 'cms-css'; }
  kind = 'css' as const;
  service = new CmsCssService();
}
