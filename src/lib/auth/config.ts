import 'server-only';

export const SESSION_COOKIE = 'session';
export const GUEST_COOKIE = 'guest';
export const OAUTH_STATE_COOKIE = 'oauth_state';
export const OAUTH_PENDING_COOKIE = 'oauth_pending';

export { authSecret } from './secret';

export const secureCookies = () => process.env.NODE_ENV === 'production';
