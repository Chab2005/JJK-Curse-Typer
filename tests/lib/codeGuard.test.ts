import { beforeEach, describe, expect, it } from 'vitest';
import { CODE_MAX_FAILURES, CODE_WINDOW_MS } from '@/lib/codeAttempts';
import { checkCode, clearCodeAttempts, codeLocked, codeRetryAfterSeconds } from '@/lib/codeGuard';

beforeEach(clearCodeAttempts);

const miss = (ip: string | null, times: number, now = 0) => {
  for (let i = 0; i < times; i++) checkCode(ip, 'missing', now);
};

describe('registre des tentatives de code (SALLE-10)', () => {
  it('compte par IP', () => {
    miss('1.1.1.1', CODE_MAX_FAILURES);
    expect(codeLocked('1.1.1.1', 0)).toBe(true);
    expect(codeLocked('2.2.2.2', 0)).toBe(false);
    expect(checkCode('2.2.2.2', 'found', 0)).toBe('allow');
  });

  it('refuse un bon code à une IP bloquée, mais pas à quelqu’un déjà dans le salon', () => {
    miss('1.1.1.1', CODE_MAX_FAILURES);
    expect(checkCode('1.1.1.1', 'found', 1)).toBe('blocked');
    expect(checkCode('1.1.1.1', 'inside', 1)).toBe('allow');
  });

  it('lève le blocage une minute après', () => {
    miss('1.1.1.1', CODE_MAX_FAILURES, 0);
    expect(codeRetryAfterSeconds('1.1.1.1', 1_000)).toBe(59);
    expect(checkCode('1.1.1.1', 'found', CODE_WINDOW_MS)).toBe('allow');
    expect(codeLocked('1.1.1.1', CODE_WINDOW_MS)).toBe(false);
  });

  it('une entrée réussie ne compte pas', () => {
    for (let i = 0; i < 50; i++) checkCode('1.1.1.1', 'found', i);
    expect(codeLocked('1.1.1.1', 50)).toBe(false);
  });

  it('regroupe les requêtes sans IP', () => {
    miss(null, CODE_MAX_FAILURES);
    expect(checkCode(null, 'missing', 1)).toBe('blocked');
  });
});
