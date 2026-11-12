import { describe, expect, it } from 'vitest';
import { CODE_MAX_FAILURES, CODE_WINDOW_MS, codeBlocked, codeDecision, codeRetryAfterMs, recentFailures, registerCodeFailure } from '@/lib/codeAttempts';

const failures = (count: number, at: number) => Array.from({ length: count }, () => at);

describe('tentatives de code de salle (SALLE-10)', () => {
  it('limite à 10 échecs par minute et par IP', () => {
    expect(CODE_MAX_FAILURES).toBe(10);
    expect(CODE_WINDOW_MS).toBe(60_000);
  });

  it('ne bloque pas une IP sans échec', () => {
    expect(codeBlocked([], 0)).toBe(false);
    expect(codeRetryAfterMs([], 0)).toBe(0);
  });

  it('ne bloque pas avant le dixième échec', () => {
    expect(codeBlocked(failures(9, 1000), 1000)).toBe(false);
  });

  it('bloque au dixième échec dans la minute', () => {
    expect(codeBlocked(failures(10, 1000), 1000)).toBe(true);
  });

  it('oublie les échecs sortis de la fenêtre glissante', () => {
    const list = [...failures(5, 0), ...failures(5, 30_000)];
    expect(codeBlocked(list, 59_999)).toBe(true);
    expect(codeBlocked(list, 60_000)).toBe(false);
    expect(recentFailures(list, 60_000)).toEqual(failures(5, 30_000));
  });

  it('dit quand le blocage se lève', () => {
    const list = [0, ...failures(9, 20_000)];
    expect(codeRetryAfterMs(list, 30_000)).toBe(30_000);
  });

  it('ne garde que les échecs utiles', () => {
    let list: number[] = [];
    for (let i = 0; i < 25; i++) list = registerCodeFailure(list, i);
    expect(list).toHaveLength(CODE_MAX_FAILURES);
    expect(list.at(-1)).toBe(24);
  });

  it('retire les échecs périmés en en ajoutant un', () => {
    expect(registerCodeFailure([0, 1], CODE_WINDOW_MS + 5)).toEqual([CODE_WINDOW_MS + 5]);
  });
});

describe('codeDecision', () => {
  it('laisse passer quelqu’un déjà dans le salon, même bloqué, sans compter', () => {
    const list = failures(10, 0);
    expect(codeDecision(list, 'inside', 0)).toEqual({ verdict: 'allow', failures: list });
  });

  it('laisse passer un code qui ouvre un salon, sans compter', () => {
    expect(codeDecision([1], 'found', 2)).toEqual({ verdict: 'allow', failures: [1] });
  });

  it('compte un code qui ne mène à aucun salon', () => {
    expect(codeDecision([], 'missing', 5)).toEqual({ verdict: 'deny', failures: [5] });
  });

  it('refuse tout, même un bon code, une fois bloqué, et compte la tentative', () => {
    const list = failures(10, 0);
    const decision = codeDecision(list, 'found', 10);
    expect(decision.verdict).toBe('blocked');
    expect(decision.failures.at(-1)).toBe(10);
  });

  it('bloque dès la tentative qui atteint la limite suivante', () => {
    const list = failures(9, 0);
    expect(codeDecision(list, 'missing', 1).verdict).toBe('deny');
    expect(codeDecision(registerCodeFailure(list, 1), 'missing', 2).verdict).toBe('blocked');
  });
});
