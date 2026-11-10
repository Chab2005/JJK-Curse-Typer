import { describe, expect, it } from 'vitest';
import { membershipDecision } from '@/components/lobby/membership';

describe('membershipDecision (SALLE-06)', () => {
  it('lets a user with no lobby join', () => {
    expect(membershipDecision(null, 'ABC-DEF', false)).toBe('free');
  });
  it('lets a user re-enter the lobby they are already in', () => {
    expect(membershipDecision('ABC-DEF', 'ABC-DEF', true)).toBe('same');
  });
  it('refuses a second lobby while the first still holds the user', () => {
    expect(membershipDecision('ABC-DEF', 'XYZ-123', true)).toBe('elsewhere');
  });
  it('ignores a stale row whose lobby is gone or no longer holds the user', () => {
    expect(membershipDecision('ABC-DEF', 'XYZ-123', false)).toBe('free');
  });
  it('compares codes without case', () => {
    expect(membershipDecision('abc-def', 'ABC-DEF', true)).toBe('same');
  });
});
