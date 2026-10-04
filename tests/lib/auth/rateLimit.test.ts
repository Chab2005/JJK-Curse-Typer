import { describe, expect, it } from 'vitest';
import { LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS, isBlocked, registerFailure } from '@/lib/auth/rateLimit';

describe('rateLimit (AUTH-7)', () => {
  const t0 = 1_000_000;
  it('bloque après le nombre maximal d’échecs dans la fenêtre', () => {
    let state = null;
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      expect(isBlocked(state, t0 + i)).toBe(false);
      state = registerFailure(state, t0 + i);
    }
    expect(isBlocked(state, t0 + 10)).toBe(true);
  });
  it('repart de zéro une fois la fenêtre écoulée', () => {
    let state = null;
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) state = registerFailure(state, t0);
    expect(isBlocked(state, t0 + LOGIN_WINDOW_MS + 1)).toBe(false);
    expect(registerFailure(state, t0 + LOGIN_WINDOW_MS + 1)).toEqual({ count: 1, windowStart: t0 + LOGIN_WINDOW_MS + 1 });
  });
});
