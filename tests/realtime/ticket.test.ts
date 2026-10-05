import { describe, expect, it } from 'vitest';
import { readSeatTicket, seatTicket } from '@/realtime/ticket';

const SECRET = 'test-secret';

describe('seatTicket', () => {
  it('donne le siège du joueur pour la course de ce lobby seulement', () => {
    const ticket = seatTicket('ABC-DEF', 'Yuji', SECRET);
    expect(readSeatTicket(ticket, 'abc-def', SECRET)).toBe('Yuji');
    expect(readSeatTicket(ticket, 'ZZZ-ZZZ', SECRET)).toBeNull();
  });

  it('refuse un ticket falsifié, signé ailleurs ou absent', () => {
    const ticket = seatTicket('ABC-DEF', 'Yuji', SECRET);
    expect(readSeatTicket(ticket, 'ABC-DEF', 'other-secret')).toBeNull();
    expect(readSeatTicket(`${ticket}x`, 'ABC-DEF', SECRET)).toBeNull();
    expect(readSeatTicket(undefined, 'ABC-DEF', SECRET)).toBeNull();
  });
});
