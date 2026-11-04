import { describe, expect, it } from 'vitest';
import { startPowers } from '@/game/powers';
import { acknowledge, addStroke, emptyLog, markSent, replay, rewindSent, unsent } from '@/game/strokeLog';
import { startTyping } from '@/game/typing';

const log = () => ['a', 'b', 'c'].reduce((current, key, i) => addStroke(current, { key, t: (i + 1) * 100 }), emptyLog());

describe('journal des frappes', () => {
  it('numérote les frappes et donne celles à envoyer', () => {
    expect(unsent(log(), 2)).toEqual({ strokes: [{ key: 'a', t: 100 }, { key: 'b', t: 200 }], seq: 2 });
    expect(unsent(markSent(log(), 2), 10)).toEqual({ strokes: [{ key: 'c', t: 300 }], seq: 3 });
    expect(unsent(markSent(log(), 3), 10)).toBeNull();
  });

  it('oublie ce que le serveur a confirmé', () => {
    expect(acknowledge(markSent(log(), 3), 2).strokes.map((s) => s.key)).toEqual(['c']);
  });

  it('renvoie après une coupure ce qui n’a pas été confirmé', () => {
    const lost = rewindSent(acknowledge(markSent(log(), 3), 1));
    expect(unsent(lost, 10)).toEqual({ strokes: [{ key: 'b', t: 200 }, { key: 'c', t: 300 }], seq: 3 });
  });

  it('rejoue sur la saisie du serveur ce qu’il n’a pas encore reçu, sauf pendant un étourdissement', () => {
    const server = startTyping('abcd', 'accumulate');
    expect(replay(server, log(), startPowers()).input).toBe('abc');
    expect(replay(server, log(), { ...startPowers(), stun: { from: 150, until: 250 } }).input).toBe('ac');
  });
});
