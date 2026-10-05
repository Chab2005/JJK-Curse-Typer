import { describe, expect, it } from 'vitest';
import { sign, verify } from '@/lib/auth/signedCookie';

describe('signedCookie', () => {
  it('relit ce qu’il a signé', () => {
    expect(verify(sign({ a: 1 }, 'secret'), 'secret')).toEqual({ a: 1 });
  });
  it('refuse un cookie modifié', () => {
    const [payload, mac] = sign({ a: 1 }, 'secret').split('.');
    const forged = `${Buffer.from(JSON.stringify({ a: 2 })).toString('base64url')}.${mac}`;
    expect(payload).not.toBe(forged.split('.')[0]);
    expect(verify(forged, 'secret')).toBeNull();
  });
  it('refuse une autre clé et les valeurs mal formées', () => {
    expect(verify(sign({ a: 1 }, 'secret'), 'other')).toBeNull();
    expect(verify('garbage', 'secret')).toBeNull();
    expect(verify(undefined, 'secret')).toBeNull();
  });
});
