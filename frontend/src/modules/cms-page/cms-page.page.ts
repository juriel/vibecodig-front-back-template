import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { CrudPage } from '../../crud/crud-page';
import { CmsPageTable } from './cms-page.table';
import { CmsPageForm } from './cms-page.form';
import { I18n } from '../../lib/i18n';
import { CmsPageDTO } from './cms-page.service';
import { bandBtn } from '../../lib/title-band';
import { icon } from '../../lib/icons';
import { toast } from '../../lib/toast';
import { SessionStatus } from '../../lib/session';
import './ai-draft-dialog';

@customElement('cms-page-page')
export class CmsPagePage extends CrudPage<CmsPageDTO> {
  get prefix() { return 'cms-page'; }
  label = I18n.t('menu.pages');
  createTable = () => new CmsPageTable();
  createForm  = () => new CmsPageForm();
  @state() private drafting = false;

  /** "Create with AI" next to "New" (needs the privilege to create pages). */
  protected bandActions() {
    if (!SessionStatus.getInstance().allowed('cms-page', 'create')) return '';
    return html`<button class=${bandBtn.ghost} @click=${() => { this.drafting = true; }}>${icon('sparkles', 'size-4')}${I18n.t('ai.open')}</button>`;
  }

  render() {
    return html`${super.render()}
      ${this.drafting ? html`<ai-draft-dialog @dialog-close=${() => { this.drafting = false; }}
          @draft-created=${(e: CustomEvent<CmsPageDTO>) => { this.drafting = false; toast(I18n.t('ai.created'), 'success'); this.openEdit(e.detail); }}></ai-draft-dialog>` : ''}`;
  }
}
