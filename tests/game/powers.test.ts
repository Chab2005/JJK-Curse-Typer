import { describe, expect, it } from 'vitest';
import { castBlocker, hasCursedEnergy, racerMarks, startPowers, stunnedAt, techniquesOf, type CasterView } from '@/game/powers';

const view = (patch: Partial<CasterView> = {}): CasterView => ({ character: 'sukuna', energy: 1500, powers: startPowers(), gameMode: 'normal', ...patch });

describe('castBlocker', () => {
  it('laisse lancer une capacité payable', () => {
    expect(castBlocker(view(), 'cleave', 0)).toBeNull();
    expect(castBlocker(view(), 'domain', 0)).toBeNull();
    expect(castBlocker(view(), 'vow', 0)).toBeNull();
  });

  it('refuse sans assez d’énergie, le territoire demandant 1000 EP', () => {
    expect(castBlocker(view({ energy: 249 }), 'cleave', 0)).toBe('energy');
    expect(castBlocker(view({ energy: 999 }), 'domain', 0)).toBe('energy');
    expect(castBlocker(view({ character: 'megumi', energy: 999 }), 'mahoraga', 0)).toBe('energy');
  });

  it('refuse une capacité qui n’est pas celle du personnage', () => {
    expect(castBlocker(view(), 'blue', 0)).toBe('none');
    expect(castBlocker(view({ character: 'yuji' }), 'domain', 0)).toBe('none');
  });

  it('ne donne rien à Maki, pas même le pacte', () => {
    for (const ability of ['domain', 'vow', 'cleave'] as const) expect(castBlocker(view({ character: 'maki' }), ability, 0)).toBe('none');
    expect(hasCursedEnergy('maki')).toBe(false);
  });

  it('donne Boogie-Woogie à Todo', () => {
    expect(techniquesOf('todo').map((t) => t.id)).toEqual(['boogieWoogie']);
    expect(castBlocker(view({ character: 'todo' }), 'boogieWoogie', 0)).toBeNull();
  });

  it('exige Découpe puis Démantèlement juste avant Flammes divines', () => {
    expect(castBlocker(view(), 'divineFlames', 0)).toBe('chain');
    expect(castBlocker(view({ powers: { ...startPowers(), chain: ['dismantle', 'cleave'] } }), 'divineFlames', 0)).toBe('chain');
    expect(castBlocker(view({ powers: { ...startPowers(), chain: ['cleave', 'dismantle'] } }), 'divineFlames', 0)).toBeNull();
  });

  it('bloque tout en mode Restriction céleste, et seulement le territoire sans territoire', () => {
    for (const ability of ['domain', 'vow', 'cleave'] as const) expect(castBlocker(view({ gameMode: 'heavenly' }), ability, 0)).toBe('mode');
    expect(castBlocker(view({ gameMode: 'noDomain' }), 'domain', 0)).toBe('mode');
    expect(castBlocker(view({ gameMode: 'noDomain' }), 'cleave', 0)).toBeNull();
  });

  it('bloque pendant un étourdissement, un sceau, un territoire ouvert et le verrou qui suit', () => {
    const at = (powers: Partial<CasterView['powers']>, t: number) => castBlocker(view({ powers: { ...startPowers(), ...powers } }), 'cleave', t);
    expect(at({ stun: { from: 100, until: 200 } }, 150)).toBe('stunned');
    expect(at({ stun: { from: 100, until: 200 } }, 200)).toBeNull();
    expect(at({ sealedUntil: 200 }, 150)).toBe('sealed');
    expect(at({ domainUntil: 200 }, 150)).toBe('domainOpen');
    expect(at({ lockedUntil: 200 }, 150)).toBe('locked');
  });

  it('le pacte retire la technique, pas le territoire, et ne se fait qu’une fois', () => {
    const powers = { ...startPowers(), vowed: true };
    expect(castBlocker(view({ powers }), 'cleave', 0)).toBe('vowed');
    expect(castBlocker(view({ powers }), 'vow', 0)).toBe('vowed');
    expect(castBlocker(view({ powers }), 'domain', 0)).toBeNull();
  });
});

describe('stunnedAt', () => {
  it('ne vaut que dans la fenêtre de l’étourdissement', () => {
    const powers = { ...startPowers(), stun: { from: 100, until: 200 } };
    expect([99, 100, 199, 200].map((t) => stunnedAt(powers, t))).toEqual([false, true, true, false]);
  });
});

describe('racerMarks', () => {
  it('liste les états en cours', () => {
    const powers = { ...startPowers(), stun: { from: 0, until: 500 }, lagUntil: 500, ward: 'deflect' as const, sealedUntil: 10 };
    expect(racerMarks(powers, 100)).toEqual(['stunned', 'lagging', 'warded']);
    expect(racerMarks(startPowers(), 100)).toEqual([]);
  });
});
