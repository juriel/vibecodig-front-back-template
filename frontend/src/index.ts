import './styles.css';
import { SessionStatus } from './lib/session';
import './app-root';
import './modules/login/login-page';
import './modules/home/home-page';
import './modules/example/example-page';
// Import modules here

SessionStatus.installInterceptors();
