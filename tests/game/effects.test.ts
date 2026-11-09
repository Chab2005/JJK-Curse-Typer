import { describe, expect, it } from 'vitest';
import { DOMAIN_DRAIN, DOMAIN_LOCK_SECONDS, DOMAIN_SECONDS, type CastAbility, type GameMode } from '@/game/abilities';
import { castAbility, casterPower, mahoragaWpm, MAHORAGA_START_WPM, resolveFlashes, topHalf } from '@/game/effects';
import { ENERGY_MAX } from '@/game/energy';
import { BLACK_FLASH_STUN_MS, BOOST_MS, stunnedAt, type RacerPowers } from '@/game/powers';
import { applyKeys, COUNTDOWN_MS, createRace, raceReducer, standings, type RaceState, type Racer, type RacerSeat } from '@/game/race';

const T0 = 1_000_000;
const START = T0 + COUNTDOWN_MS;
const TEXT = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ');

const human = (id: string, avatar: RacerSeat['avatar']): RacerSeat => ({ id, name: id, avatar, kind: 'human', level: null });

/** Course lancée : quatre joueurs, tous tenus par des joueurs pour que rien ne bouge seul. */
function racing(avatars: RacerSeat['avatar'][] = ['sukuna', 'yuji', 'gojo', 'nobara'], gameMode: GameMode = 'normal', energy = 1500): RaceState {
  const seats = avatars.map((avatar, i) => human(`p${i}`, avatar));
  const race = createRace({ seats, text: TEXT, mode: 'accumulate', timerMs: 0, bonus: gameMode !== 'heavenly', gameMode, now: T0, seed: 7 });
  const claimed = seats.reduce((current, { id }) => raceReducer(current, { type: 'claim', id, now: T0 }), race);
  const started = raceReducer(claimed, { type: 'tick', now: START });
  return { ...started, racers: started.racers.map((racer) => ({ ...racer, energy: racer.character === 'maki' ? 0 : energy })) };
}

const racer = (race: RaceState, id: string) => race.racers.find((r) => r.seat.id === id)!;
const edit = (race: RaceState, id: string, patch: Partial<Racer>): RaceState => ({ ...race, racers: race.racers.map((r) => (r.seat.id === id ? { ...r, ...patch } : r)) });
const editPowers = (race: RaceState, id: string, patch: Partial<RacerPowers>) => edit(race, id, { powers: { ...racer(race, id).powers, ...patch } });
const at = (race: RaceState, id: string, chars: number): RaceState => edit(race, id, { typing: { ...racer(race, id).typing, input: TEXT.slice(0, chars), peak: chars } });
const cast = (race: RaceState, id: string, ability: CastAbility, t = 1000) => castAbility(race, id, ability, t);
const tickAt = (race: RaceState, t: number) => raceReducer(race, { type: 'tick', now: START + t });
/** Seul `p1` peut être touché : `p0` lance depuis l'arrière. */
const duel = (a: RacerSeat['avatar'], b: RacerSeat['avatar']) => at(racing([a, b]), 'p1', 100);

describe('topHalf', () => {
  it('ne vise que la moitié avant, sans le lanceur', () => {
    const race = at(at(racing(), 'p1', 50), 'p2', 40);
    expect(topHalf(race, 'p3').map((r) => r.seat.id).sort()).toEqual(['p1', 'p2']);
    expect(topHalf(race, 'p1').map((r) => r.seat.id)).toEqual(['p2']);
  });

  it('prend un autre coureur quand le lanceur est seul devant', () => {
    expect(topHalf(at(racing(['yuji', 'gojo']), 'p0', 50), 'p0').map((r) => r.seat.id)).toEqual(['p1']);
  });

  it('laisse de côté ceux qui ne courent plus', () => {
    const race = edit(at(racing(), 'p1', 50), 'p1', { status: 'finished' });
    expect(topHalf(race, 'p0').map((r) => r.seat.id)).not.toContain('p1');
  });
});

describe('casterPower', () => {
  it('monte avec le retard, jusqu’à la moitié de la course', () => {
    const half = Math.round(TEXT.length / 2);
    expect(casterPower(racing(), 'p0')).toBe(0);
    expect(casterPower(at(racing(), 'p1', half), 'p0')).toBeCloseTo(1, 1);
    expect(casterPower(at(racing(), 'p1', Math.round(half / 2)), 'p0')).toBeCloseTo(0.5, 1);
  });
});

describe('castAbility', () => {
  it('fait payer la technique et refuse sans énergie', () => {
    const { race, refused } = cast(racing(), 'p0', 'cleave');
    expect(refused).toBeNull();
    expect(racer(race, 'p0').energy).toBe(1250);
    expect(cast(racing(undefined, 'normal', 100), 'p0', 'cleave')).toMatchObject({ refused: 'energy' });
  });

  it('refuse hors de la course, sans rien changer', () => {
    const race = edit(racing(), 'p0', { status: 'finished' });
    expect(cast(race, 'p0', 'cleave')).toEqual({ race, refused: 'notRacing' });
  });

  it('ne fait rien payer en énergie illimitée', () => {
    expect(racer(cast(racing(undefined, 'unlimitedCe'), 'p0', 'cleave').race, 'p0').energy).toBe(1500);
  });

  it('refuse tout en Restriction céleste et le territoire sans territoire', () => {
    expect(cast(racing(undefined, 'heavenly'), 'p0', 'cleave').refused).toBe('mode');
    expect(cast(racing(undefined, 'noDomain'), 'p0', 'domain').refused).toBe('mode');
  });

  it('refuse une attaque sans cible', () => {
    const race = edit(racing(['nobara', 'gojo']), 'p1', { status: 'finished' });
    expect(cast(race, 'p0', 'resonance').refused).toBe('noTarget');
  });

  it('annonce le lancement', () => {
    expect(cast(racing(), 'p0', 'cleave').race.notices).toEqual([{ kind: 'cast', by: 'p0', ability: 'cleave', target: null, outcome: 'self' }]);
  });
});

describe('effets des techniques', () => {
  it('étourdit de 3 s sans retard et de 5 s avec le plus grand retard', () => {
    const near = cast(racing(['nobara', 'yuji']), 'p0', 'resonance').race;
    expect(racer(near, 'p1').powers.stun).toEqual({ from: 1000, until: 4000 });
    const far = cast(at(racing(['nobara', 'yuji']), 'p1', 200), 'p0', 'resonance').race;
    expect(racer(far, 'p1').powers.stun).toEqual({ from: 1000, until: 6000 });
  });

  it('Black Flash étourdit la cible et accélère son lanceur', () => {
    const { race } = cast(duel('yuji', 'gojo'), 'p0', 'blackFlash');
    expect(stunnedAt(racer(race, 'p1').powers, 1500)).toBe(true);
    expect(racer(race, 'p0').powers.boostUntil).toBe(1000 + BOOST_MS);
  });

  it('Épingle ajoute 2 à 4 mots à la fin du texte de la cible', () => {
    const { race } = cast(at(racing(['nobara', 'yuji']), 'p1', 200), 'p0', 'hairpin');
    const { text, input } = racer(race, 'p1').typing;
    expect(text.startsWith(TEXT)).toBe(true);
    expect(text.slice(TEXT.length).trim().split(' ')).toHaveLength(4);
    expect(input).toHaveLength(200);
  });

  it('Crapaud fait perdre un mot à la cible', () => {
    const { race } = cast(at(racing(['megumi', 'yuji']), 'p1', 12), 'p0', 'toad');
    expect(racer(race, 'p1').typing.input).toBe('word0 ');
  });

  it('les techniques sur soi font sauter des mots, sans jamais finir la course', () => {
    const { race } = cast(racing(['gojo', 'yuji']), 'p0', 'purple');
    expect(racer(race, 'p0').typing.input).toBe('word0 word1 ');
    const almost = cast(at(racing(['gojo', 'yuji']), 'p0', TEXT.length - 8), 'p0', 'purple').race;
    expect(racer(almost, 'p0').typing).toMatchObject({ finishedAt: null });
    expect(racer(almost, 'p0').status).toBe('racing');
  });

  it('Sukuna enchaîne Découpe, Démantèlement puis Flammes divines', () => {
    let race = racing(['sukuna', 'yuji']);
    expect(cast(race, 'p0', 'divineFlames').refused).toBe('chain');
    race = cast(race, 'p0', 'cleave').race;
    race = cast(race, 'p0', 'dismantle').race;
    expect(cast(race, 'p0', 'divineFlames').refused).toBeNull();
    expect(racer(cast(race, 'p0', 'divineFlames').race, 'p0').typing.input).toBe(TEXT.slice(0, TEXT.indexOf('word5')));
  });

  it('Boogie-Woogie échange les places au début d’un mot', () => {
    const { race } = cast(at(at(racing(['todo', 'yuji']), 'p0', 12), 'p1', 120), 'p0', 'boogieWoogie');
    expect(racer(race, 'p0').typing.input.length).toBe(TEXT.lastIndexOf(' ', 119) + 1);
    expect(racer(race, 'p1').typing.input.length).toBe(TEXT.lastIndexOf(' ', 11) + 1);
  });

  it('Échelle de Jacob scelle la cible', () => {
    const { race } = cast(duel('yuta', 'sukuna'), 'p0', 'jacobsLadder');
    expect(cast(race, 'p1', 'cleave', 1500).refused).toBe('sealed');
  });

  it('Lapins d’évasion esquive une attaque', () => {
    const race = cast(duel('nobara', 'megumi'), 'p1', 'rabbitEscape').race;
    const { race: after } = cast(race, 'p0', 'resonance', 2000);
    expect(racer(after, 'p1').powers.stun).toBeNull();
    expect(after.notices.at(-1)).toMatchObject({ outcome: 'dodged' });
  });

  it('Rouge annule la prochaine attaque, une seule fois', () => {
    const race = cast(duel('nobara', 'gojo'), 'p1', 'red').race;
    const first = cast(race, 'p0', 'resonance', 2000).race;
    expect(racer(first, 'p1').powers).toMatchObject({ stun: null, ward: null });
    expect(first.notices.at(-1)).toMatchObject({ outcome: 'deflected' });
    expect(racer(cast(first, 'p0', 'resonance', 2100).race, 'p1').powers.stun).not.toBeNull();
  });

  it('Cerf rond renvoie l’attaque à son lanceur', () => {
    const race = cast(duel('nobara', 'megumi'), 'p1', 'roundDeer').race;
    const { race: after } = cast(race, 'p0', 'resonance', 2000);
    expect(racer(after, 'p0').powers.stun).not.toBeNull();
    expect(racer(after, 'p1').powers).toMatchObject({ stun: null, ward: null });
    expect(after.notices.at(-1)).toMatchObject({ outcome: 'reflected' });
  });

  it('un échange de places renvoyé est seulement annulé', () => {
    const race = cast(at(at(racing(['todo', 'megumi']), 'p0', 12), 'p1', 120), 'p1', 'roundDeer').race;
    const { race: after } = cast(race, 'p0', 'boogieWoogie', 2000);
    expect(racer(after, 'p0').typing.input).toHaveLength(12);
    expect(after.notices.at(-1)).toMatchObject({ outcome: 'deflected' });
  });
});

describe('étourdissement et frappe', () => {
  const stunned = () => editPowers(racing(['yuji', 'gojo']), 'p0', { stun: { from: 200, until: 600 } });

  it('ignore les frappes de la fenêtre et confirme le lot', () => {
    const strokes = [{ key: 'w', t: 100 }, { key: 'x', t: 300 }, { key: 'o', t: 700 }];
    const { race, accepted } = applyKeys(stunned(), 'p0', strokes, START + 800, 3);
    expect(accepted).toBe(true);
    expect(racer(race, 'p0')).toMatchObject({ acked: 3, typing: { input: 'wo', keystrokes: 2 } });
  });

  it('fait attendre un bot jusqu’à la fin de l’étourdissement', () => {
    const seats: RacerSeat[] = [human('p0', 'yuji'), { id: 'b', name: '1', avatar: 'gojo', kind: 'bot', level: 'special_grade' }];
    const base = createRace({ seats, text: TEXT, mode: 'block', timerMs: 0, bonus: true, now: T0, seed: 3 });
    const started = tickAt(raceReducer(base, { type: 'claim', id: 'p0', now: T0 }), 0);
    const held = tickAt(editPowers(started, 'b', { stun: { from: 0, until: 5000 } }), 4000);
    expect(racer(held, 'b').typing.keystrokes).toBe(0);
    expect(racer(tickAt(held, 6000), 'b').typing.keystrokes).toBeGreaterThan(0);
  });
});

describe('territoires', () => {
  const opened = (avatars: RacerSeat['avatar'][], gameMode: GameMode = 'normal') => cast(racing(avatars, gameMode), 'p0', 'domain', 1000).race;

  it('s’ouvre à partir de 1000 EP, draine chaque seconde puis se ferme et bloque les techniques', () => {
    let race = opened(['gojo', 'yuji']);
    expect(race.notices.at(-1)).toEqual({ kind: 'domain', by: 'p0', character: 'gojo', open: true });
    race = tickAt(race, 1000);
    expect(racer(race, 'p0').energy).toBe(1500 - DOMAIN_DRAIN);
    const closesAt = 1000 + DOMAIN_SECONDS * 1000;
    race = tickAt(race, closesAt);
    expect(racer(race, 'p0').energy).toBe(1500 - DOMAIN_SECONDS * DOMAIN_DRAIN);
    expect(racer(race, 'p0').powers.domainUntil).toBe(0);
    expect(race.notices.at(-1)).toEqual({ kind: 'domain', by: 'p0', character: 'gojo', open: false });
    expect(cast(race, 'p0', 'blue', closesAt + 100).refused).toBe('locked');
    expect(cast(race, 'p0', 'blue', closesAt + DOMAIN_LOCK_SECONDS * 1000).refused).toBeNull();
  });

  it('ne draine rien en énergie illimitée', () => {
    expect(racer(tickAt(opened(['gojo', 'yuji'], 'unlimitedCe'), 2000), 'p0').energy).toBe(ENERGY_MAX);
  });

  it('Gojo fige tous les autres, sauf Maki', () => {
    const race = tickAt(opened(['gojo', 'yuji', 'maki']), 1000);
    expect(stunnedAt(racer(race, 'p1').powers, 1500)).toBe(true);
    expect(racer(race, 'p2').powers.stun).toBeNull();
  });

  it('Sukuna ajoute un mot par seconde aux autres, sauf à Maki', () => {
    const race = tickAt(opened(['sukuna', 'yuji', 'maki']), 3000);
    const added = racer(race, 'p1').typing.text.slice(TEXT.length).trim().split(' ');
    expect(added).toHaveLength(3);
    expect(racer(race, 'p2').typing.text).toBe(TEXT);
  });

  it('épargne qui esquive avec Lapins d’évasion', () => {
    const race = editPowers(opened(['gojo', 'megumi']), 'p1', { untouchableUntil: 5000 });
    expect(racer(tickAt(race, 1000), 'p1').powers.stun).toBeNull();
  });

  it('ignore les parades', () => {
    const race = editPowers(opened(['gojo', 'yuji']), 'p1', { ward: 'deflect' });
    const after = tickAt(race, 1000);
    expect(racer(after, 'p1').powers).toMatchObject({ ward: 'deflect' });
    expect(stunnedAt(racer(after, 'p1').powers, 1500)).toBe(true);
  });

  it('Megumi active ses shikigamis chaque seconde, sans Mahoraga ni frais', () => {
    const race = tickAt(opened(['megumi', 'yuji']), 1000);
    expect(racer(race, 'p0').typing.input.length).toBeGreaterThan(0);
    expect(racer(race, 'p0').powers).toMatchObject({ ward: 'reflect' });
    expect(race.racers).toHaveLength(2);
    expect(racer(race, 'p0').energy).toBe(1500 - DOMAIN_DRAIN);
  });

  it('Yuta lance une technique copiée par seconde, gratuitement', () => {
    const race = tickAt(opened(['yuta', 'sukuna']), 4000);
    const { powers } = racer(race, 'p1');
    expect(powers.sealedUntil > 0 || powers.stun !== null || racer(race, 'p0').powers.ward !== null).toBe(true);
    expect(racer(race, 'p0').energy).toBe(1500 - 4 * DOMAIN_DRAIN);
  });

  it('se ferme si son lanceur finit la course', () => {
    const race = tickAt(edit(opened(['gojo', 'yuji']), 'p0', { status: 'finished', endedAt: 1500 }), 2000);
    expect(racer(race, 'p0').powers.domainUntil).toBe(0);
  });
});

describe('pacte contraignant', () => {
  it('donne 30 % de la course et retire la technique', () => {
    const { race } = cast(racing(['gojo', 'yuji']), 'p0', 'vow');
    const { input } = racer(race, 'p0').typing;
    expect(input.length).toBeGreaterThan(TEXT.length * 0.28);
    expect(input.length).toBeLessThanOrEqual(TEXT.length * 0.3 + 1);
    expect(input.endsWith(' ')).toBe(true);
    expect(cast(race, 'p0', 'blue', 2000).refused).toBe('vowed');
    expect(cast(race, 'p0', 'vow', 2000).refused).toBe('vowed');
  });

  it('ne coûte aucune énergie et n’est pas offert à Maki', () => {
    expect(racer(cast(racing(['gojo', 'yuji']), 'p0', 'vow').race, 'p0').energy).toBe(1500);
    expect(cast(racing(['maki', 'yuji']), 'p0', 'vow').refused).toBe('none');
  });
});

describe('Mahoraga', () => {
  const summoned = () => cast(at(racing(['megumi', 'yuji']), 'p0', 60), 'p0', 'mahoraga').race;

  it('vide l’énergie, retire Megumi de la course et fait entrer Mahoraga à sa place', () => {
    const race = summoned();
    expect(racer(race, 'p0')).toMatchObject({ status: 'summoned', energy: 0, endedAt: 1000 });
    expect(racer(race, 'mahoraga:p0')).toMatchObject({ status: 'racing', driver: 'sim', seat: { kind: 'bot', summon: true }, typing: { input: TEXT.slice(0, 60) } });
    expect(race.notices.at(-1)).toEqual({ kind: 'summon', by: 'p0', seat: 'mahoraga:p0' });
  });

  it('demande au moins 1000 EP', () => {
    expect(cast(racing(['megumi', 'yuji'], 'normal', 999), 'p0', 'mahoraga').refused).toBe('energy');
  });

  it('double sa vitesse à chaque lettre', () => {
    expect(mahoragaWpm(0)).toBe(MAHORAGA_START_WPM);
    expect(mahoragaWpm(1)).toBe(MAHORAGA_START_WPM * 2);
    expect(mahoragaWpm(3)).toBe(MAHORAGA_START_WPM * 8);
  });

  it('finit le texte quelques instants après son arrivée, quelle qu’en soit la longueur', () => {
    const race = tickAt(summoned(), 3000);
    expect(racer(race, 'mahoraga:p0')).toMatchObject({ status: 'finished' });
    expect(racer(race, 'mahoraga:p0').endedAt).toBeLessThan(3000);
  });

  it('la course attend Mahoraga quand il ne reste plus d’humain', () => {
    const alone = edit(summoned(), 'p1', { status: 'finished', endedAt: 900 });
    expect(tickAt(alone, 1200).phase).toBe('racing');
  });

  it('Megumi passe derrière ceux qui courent au classement', () => {
    const race = summoned();
    expect(standings(race, START + 1500).at(-1)).toMatchObject({ id: 'p0', status: 'summoned' });
  });
});

describe('Black Flash en tapant', () => {
  it('étourdit un coureur de la moitié avant et accélère l’énergie du frappeur', () => {
    const race = resolveFlashes(edit(at(racing(['yuji', 'gojo']), 'p1', 100), 'p0', { flashes: 1 }), 1000);
    expect(racer(race, 'p1').powers.stun).toEqual({ from: 1000, until: 1000 + BLACK_FLASH_STUN_MS });
    expect(racer(race, 'p0')).toMatchObject({ flashes: 0, powers: { boostUntil: 1000 + BOOST_MS } });
    expect(race.notices).toEqual([{ kind: 'blackFlash', by: 'p0', target: 'p1' }]);
  });

  it('touche Maki, qui n’est immunisée que contre les territoires', () => {
    const race = resolveFlashes(edit(racing(['yuji', 'maki']), 'p0', { flashes: 1 }), 1000);
    expect(racer(race, 'p1').powers.stun).not.toBeNull();
  });

  it('passe à côté d’un coureur intouchable', () => {
    const base = editPowers(edit(racing(['yuji', 'megumi']), 'p0', { flashes: 1 }), 'p1', { untouchableUntil: 5000 });
    expect(racer(resolveFlashes(base, 1000), 'p1').powers.stun).toBeNull();
  });

  /** Frappe le début du texte d'une traite. */
  const typeAll = (race: RaceState, id: string, chars = 200) => {
    const strokes = [...TEXT.slice(0, chars)].map((key, i) => ({ key, t: 100 + i * 120 }));
    return applyKeys(race, id, strokes, START + 100 + chars * 120).race;
  };

  it('double le gain d’énergie pendant le boost', () => {
    const plain = racer(typeAll(racing(['yuji', 'gojo'], 'normal', 0), 'p0', 30), 'p0').energy;
    const boosted = racer(typeAll(editPowers(racing(['yuji', 'gojo'], 'normal', 0), 'p0', { boostUntil: 100_000 }), 'p0', 30), 'p0').energy;
    expect(boosted).toBe(plain * 2);
  });

  it('Maki ne charge rien et ne déclenche jamais de Black Flash', () => {
    const race = edit(racing(['maki', 'gojo']), 'p0', { luck: 1 });
    expect(racer(typeAll(race, 'p0'), 'p0')).toMatchObject({ energy: 0, flashes: 0 });
  });

  it('rien en Restriction céleste', () => {
    expect(racer(typeAll(racing(['yuji', 'gojo'], 'heavenly', 0), 'p0'), 'p0')).toMatchObject({ energy: 0, flashes: 0 });
  });
});

describe('createRace selon le mode', () => {
  it('remplit la jauge en énergie illimitée, sauf celle de Maki', () => {
    const seats = [human('a', 'gojo'), human('b', 'maki')];
    const race = createRace({ seats, text: TEXT, mode: 'block', timerMs: 0, bonus: true, gameMode: 'unlimitedCe', now: T0, seed: 1 });
    expect(race.racers.map((r) => r.energy)).toEqual([ENERGY_MAX, 0]);
  });

  it('coupe les bonus en Restriction céleste', () => {
    const race = createRace({ seats: [human('a', 'gojo')], text: TEXT, mode: 'block', timerMs: 0, bonus: true, gameMode: 'heavenly', now: T0, seed: 1 });
    expect(race.bonus).toBe(false);
  });
});

describe('bots', () => {
  it('lancent leurs capacités quand ils en ont les moyens', () => {
    const seats: RacerSeat[] = [human('p0', 'yuji'), { id: 'b', name: '1', avatar: 'gojo', kind: 'bot', level: 'grade_1' }];
    const base = createRace({ seats, text: TEXT, mode: 'block', timerMs: 0, bonus: true, gameMode: 'unlimitedCe', now: T0, seed: 3 });
    let race = tickAt(raceReducer(base, { type: 'claim', id: 'p0', now: T0 }), 0);
    const notices = [];
    for (let t = 200; t <= 30_000; t += 200) {
      race = tickAt(race, t);
      notices.push(...race.notices);
      race = { ...race, notices: [] };
    }
    expect(notices.some((n) => n.by === 'b')).toBe(true);
  });

  it('ne lancent rien en Restriction céleste', () => {
    const seats: RacerSeat[] = [human('p0', 'yuji'), { id: 'b', name: '1', avatar: 'gojo', kind: 'bot', level: 'grade_1' }];
    const base = createRace({ seats, text: TEXT, mode: 'block', timerMs: 0, bonus: false, now: T0, seed: 3 });
    let race = tickAt(raceReducer(base, { type: 'claim', id: 'p0', now: T0 }), 0);
    for (let t = 200; t <= 30_000; t += 200) race = tickAt(race, t);
    expect(race.notices).toEqual([]);
  });
});

describe('bots soumis aux techniques comme les humains (BOT-04)', () => {
  /** Un joueur (p0, Nobara) derrière un bot (b, Gojo) déjà bien avancé. */
  function againstBot(): RaceState {
    const seats: RacerSeat[] = [human('p0', 'nobara'), { id: 'b', name: '1', avatar: 'gojo', kind: 'bot', level: 'grade_4' }];
    const base = createRace({ seats, text: TEXT, mode: 'accumulate', timerMs: 0, bonus: true, now: T0, seed: 7 });
    const started = raceReducer(raceReducer(base, { type: 'claim', id: 'p0', now: T0 }), { type: 'tick', now: START });
    const ready = { ...started, racers: started.racers.map((r) => ({ ...r, energy: 1500 })) };
    return at(ready, 'b', 100);
  }

  it('compte le bot parmi les cibles de la moitié de tête', () => {
    expect(topHalf(againstBot(), 'p0').map((r) => r.seat.id)).toEqual(['b']);
  });

  it('étourdit un bot touché par une technique d’un joueur', () => {
    const { race, refused } = cast(againstBot(), 'p0', 'resonance', 2000);
    expect(refused).toBeNull();
    expect(racer(race, 'b').powers.stun).not.toBeNull();
    expect(race.notices.at(-1)).toMatchObject({ by: 'p0', target: 'b' });
  });

  it('laisse un bot se protéger par Rouge, qui annule la technique du joueur', () => {
    const guarded = cast(againstBot(), 'b', 'red').race;
    const { race } = cast(guarded, 'p0', 'resonance', 2000);
    expect(racer(race, 'b').powers.stun).toBeNull();
    expect(race.notices.at(-1)).toMatchObject({ outcome: 'deflected' });
  });
});
