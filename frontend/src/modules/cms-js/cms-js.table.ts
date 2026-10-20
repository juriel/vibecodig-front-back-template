import { customElement } from 'lit/decorators.js';
import { CmsAssetTable } from '../cms-asset/cms-asset';
import { CmsJsService } from './cms-js.service';

@customElement('cms-js-table')
export class CmsJsTable extends CmsAssetTable {
  get prefix() { return 'cms-js'; }
  kind = 'js' as const;
  service = new CmsJsService();
}
