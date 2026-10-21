import './styles.css';
import axios from 'axios';
import { I18n } from './lib/i18n';
import { GlobalConfig } from './global-config';

// The catalog must be loaded before any component renders, so the app is imported afterwards.
I18n.init('en').then(async () => {
  axios.defaults.headers.common['Accept-Language'] = I18n.lang;   // the API translates its messages with this header
  document.title = I18n.t('app.name');
  await import('./boot');
  const [{ SessionStatus }, { Theme }] = await Promise.all([import('./lib/session'), import('./lib/theme')]);
  if (SessionStatus.getInstance().isLoggedIn)
    axios.get(GlobalConfig.getInstance().apiUrl + 'auth/me').then(r => Theme.apply(r.data.preferences)).catch(() => {});
});
