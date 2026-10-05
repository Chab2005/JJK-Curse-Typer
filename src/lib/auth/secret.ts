// Clé de signature, sans `server-only` : le serveur de course (server.ts, hors de Next) s'en sert aussi pour ses tickets.

/** Clé de signature des cookies et des tickets de course. Obligatoire en production ; en développement, une clé fixe suffit. */
export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is not set');
  return 'dev-only-secret-change-me';
}
