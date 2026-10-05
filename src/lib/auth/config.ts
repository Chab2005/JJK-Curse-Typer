import 'server-only';

export const SESSION_COOKIE = 'session';
export const GUEST_COOKIE = 'guest';
export const OAUTH_STATE_COOKIE = 'oauth_state';
export const OAUTH_PENDING_COOKIE = 'oauth_pending';

/** Clé de signature des cookies. Obligatoire en production ; en développement, une clé fixe suffit. */
export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is not set');
  return 'dev-only-secret-change-me';
}

export const secureCookies = () => process.env.NODE_ENV === 'production';
