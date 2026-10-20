import { customElement } from 'lit/decorators.js';
import { CmsAssetForm } from '../cms-asset/cms-asset';
import { CmsCssService } from './cms-css.service';

@customElement('cms-css-form')
export class CmsCssForm extends CmsAssetForm {
  get prefix() { return 'cms-css'; }
  kind = 'css' as const;
  service = new CmsCssService();
}
