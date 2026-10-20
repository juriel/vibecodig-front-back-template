import { customElement } from 'lit/decorators.js';
import { CmsAssetForm } from '../cms-asset/cms-asset';
import { CmsJsService } from './cms-js.service';

@customElement('cms-js-form')
export class CmsJsForm extends CmsAssetForm {
  get prefix() { return 'cms-js'; }
  kind = 'js' as const;
  service = new CmsJsService();
}
