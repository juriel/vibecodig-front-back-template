import './styles.css';
import { SessionStatus } from './lib/session';
import './app-root';
import './modules/login/login-page';
import './modules/home/home-page';
import './modules/example/example-page';
import './modules/user/user.page';
import './modules/user/user.table';
import './modules/user/user.form';
// Import modules here

SessionStatus.installInterceptors();
