import { createHmac, timingSafeEqual } from 'node:crypto';

// Cookie signé : `base64url(json).base64url(hmac)`. Lisible par le client, mais infalsifiable.

function mac(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payload).digest();
}

export function sign(value: unknown, secret: string): string {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${mac(payload, secret).toString('base64url')}`;
}

/** Valeur d'un cookie signé, ou `null` s'il est absent, mal formé ou falsifié. */
export function verify(cookie: string | undefined, secret: string): unknown {
  if (!cookie) return null;
  const [payload, signature, ...rest] = cookie.split('.');
  if (!payload || !signature || rest.length > 0) return null;
  const expected = mac(payload, secret);
  const given = Buffer.from(signature, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
