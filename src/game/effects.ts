// Effets des capacités sur une course (BON-*) : lancements, secondes de territoire, Black Flash et bots. Fonctions pures :
// le hasard vient de `race.rng`, repris et rendu à chaque appel. Les instants `t` sont en ms depuis le départ.
import {
  BINDING_VOW_PROGRESS,
  CHARACTER_ABILITIES,
  DOMAIN_DRAIN,
  DOMAIN_LOCK_SECONDS,
  DOMAIN_SECONDS,
  TECHNIQUE_EFFECTS,
  isTargeted,
  type CastAbility,
  type DomainOwner,
  type TechniqueId,
} from './abilities';
import { createBot } from './bots';
import { startKeyTally } from './keyStats';
import { BLACK_FLASH_STUN_MS, BOOST_MS, castBlocker, hasDomain, startPowers, techniquesOf, type CastBlocker, type RacerPowers } from './powers';
import type { Racer, RaceNotice, RaceState, RacerSeat } from './race';
import { randomStream } from './random';
import { correctChars, extendText, moveTo, startTyping, wordStartAt, wordsAhead, wordsBehind, type TypingState } from './typing';

/** Vitesse de Mahoraga à son arrivée. */
export const MAHORAGA_START_WPM = 60;
const MAHORAGA_ERROR_RATE = 0.01;
const PULSE_MS = 1000;
/** Sous le territoire de Gojo, l'étourdissement de chaque seconde tient jusqu'à la suivante. */
const VOID_STUN_MS = PULSE_MS + 200;
/** Un retard de la moitié de la course donne toute la puissance (BON-4). */
const FULL_POWER_GAP = 0.5;
/** Attente des bots entre deux lancements, et avant le premier. */
const BOT_CAST_MS = { min: 6000, spread: 6000 };
const BOT_RETRY_MS = 2000;
const BOT_DOMAIN_CHANCE = 0.5;

type Random = ReturnType<typeof randomStream>;
type Context = { t: number; random: Random; words: readonly string[] };

/** Mahoraga s'adapte : sa vitesse double à chaque lettre tapée. */
export const mahoragaWpm = (letters: number) => MAHORAGA_START_WPM * 2 ** letters;

const share = (racer: Racer) => correctChars(racer.typing) / racer.typing.text.length;

const notify = (race: RaceState, notice: RaceNotice): RaceState => ({ ...race, notices: [...race.notices, notice] });

const racerOf = (race: RaceState, id: string) => race.racers.find((racer) => racer.seat.id === id)!;

/** Change un coureur ; `revision` dit à la room que son joueur doit en être informé. */
function change(race: RaceState, id: string, update: (racer: Racer) => Partial<Racer>): RaceState {
  return { ...race, racers: race.racers.map((racer) => (racer.seat.id === id ? { ...racer, ...update(racer), revision: racer.revision + 1 } : racer)) };
}

const changePowers = (race: RaceState, id: string, update: (powers: RacerPowers) => Partial<RacerPowers>) =>
  change(race, id, ({ powers }) => ({ powers: { ...powers, ...update(powers) } }));

/** Nouvelle saisie imposée : la correction prévue par un bot n'a plus de sens. */
const retype = (race: RaceState, id: string, update: (typing: TypingState) => TypingState) =>
  change(race, id, ({ typing, bot }) => ({ typing: update(typing), bot: { ...bot, queue: [] } }));

function stun(race: RaceState, id: string, t: number, ms: number): RaceState {
  return changePowers(race, id, ({ stun: current }) => {
    const active = current !== null && t < current.until;
    return { stun: { from: active ? current.from : t, until: Math.max(active ? current.until : 0, t + ms) } };
  });
}

/** Moitié avant de la course, lanceur exclu ; s'il est seul devant, n'importe quel autre coureur (BON-3). */
export function topHalf(race: RaceState, casterId: string): Racer[] {
  const active = race.racers.filter((racer) => racer.status === 'racing').sort((a, b) => share(b) - share(a));
  const others = active.filter((racer) => racer.seat.id !== casterId);
  const top = active.slice(0, Math.ceil(active.length / 2)).filter((racer) => racer.seat.id !== casterId);
  return top.length > 0 ? top : others;
}

/** Puissance du lanceur, de 0 à 1 : son retard sur le meneur (BON-4). */
export function casterPower(race: RaceState, casterId: string): number {
  const active = race.racers.filter((racer) => racer.status === 'racing');
  const gap = Math.max(...active.map(share)) - share(racerOf(race, casterId));
  return Math.min(1, Math.max(0, gap / FULL_POWER_GAP));
}

const secondsOf = (id: TechniqueId, power: number) => {
  const ability = Object.values(CHARACTER_ABILITIES).flat().find((candidate) => candidate.id === id);
  const min = ability?.seconds ?? 0;
  return (min + ((ability?.maxSeconds ?? min) - min) * power) * 1000;
};

const addWords = (race: RaceState, id: string, count: number, { random, words }: Context) =>
  retype(race, id, (typing) => extendText(typing, Array.from({ length: count }, () => random.pick(words)).join(' ')));

/** Échange les places : chacun prend la part de course de l'autre, au début d'un mot. */
function swap(race: RaceState, a: string, b: string): RaceState {
  const place = (typing: TypingState, part: number) => wordStartAt(typing.text, Math.round(part * typing.text.length));
  const shareA = share(racerOf(race, a));
  const shareB = share(racerOf(race, b));
  return retype(retype(race, a, (typing) => moveTo(typing, place(typing, shareB))), b, (typing) => moveTo(typing, place(typing, shareA)));
}

/** Effet d'une technique sur `target`, sans parade. */
function strikeTarget(race: RaceState, id: TechniqueId, casterId: string, target: string, power: number, context: Context): RaceState {
  return receive(applyEffect(race, id, casterId, target, power, context), target);
}

/** Compte un effet reçu par `id` (RES-02). */
const receive = (race: RaceState, id: string) => change(race, id, ({ received }) => ({ received: received + 1 }));

function applyEffect(race: RaceState, id: TechniqueId, casterId: string, target: string, power: number, context: Context): RaceState {
  const { t } = context;
  const effect = TECHNIQUE_EFFECTS[id];
  const ms = secondsOf(id, power);
  switch (effect.kind) {
    case 'stun': {
      const hit = stun(race, target, t, ms);
      return effect.boost ? changePowers(hit, casterId, () => ({ boostUntil: t + BOOST_MS })) : hit;
    }
    case 'lag':
      return changePowers(race, target, ({ lagUntil }) => ({ lagUntil: Math.max(lagUntil, t + ms) }));
    case 'seal':
      return changePowers(race, target, ({ sealedUntil }) => ({ sealedUntil: Math.max(sealedUntil, t + ms) }));
    case 'addWords':
      return addWords(race, target, Math.round(effect.min + (effect.max - effect.min) * power), context);
    case 'loseWords':
      return retype(race, target, (typing) => moveTo(typing, wordsBehind(typing.text, typing.input.length, effect.words)));
    case 'swap':
      return swap(race, casterId, target);
    default:
      return race;
  }
}

/** Technique qui agit sur son lanceur. */
function strikeSelf(race: RaceState, id: TechniqueId, casterId: string, context: Context): RaceState {
  const effect = TECHNIQUE_EFFECTS[id];
  switch (effect.kind) {
    case 'skipWords':
      return retype(race, casterId, (typing) => moveTo(typing, wordsAhead(typing.text, typing.input.length, effect.words)));
    case 'ward':
      return changePowers(race, casterId, () => ({ ward: effect.ward }));
    case 'untouchable':
      return changePowers(race, casterId, () => ({ untouchableUntil: context.t + secondsOf(id, 0) }));
    default:
      return race;
  }
}

/** Attaque lancée à la main : la cible peut l'esquiver ou la parer. */
function attack(race: RaceState, id: TechniqueId, casterId: string, context: Context): RaceState {
  const { t, random } = context;
  const power = casterPower(race, casterId);
  const target = random.pick(topHalf(race, casterId));
  const targetId = target.seat.id;
  const announce = (current: RaceState, outcome: Extract<RaceNotice, { kind: 'cast' }>['outcome']) =>
    notify(current, { kind: 'cast', by: casterId, ability: id, target: targetId, outcome });

  if (target.powers.untouchableUntil > t) return announce(race, 'dodged');
  if (target.powers.ward === null) return announce(strikeTarget(race, id, casterId, targetId, power, context), 'hit');

  const parried = changePowers(race, targetId, () => ({ ward: null }));
  // Un échange de places renvoyé n'échangerait rien : il est seulement annulé.
  if (target.powers.ward === 'deflect' || TECHNIQUE_EFFECTS[id].kind === 'swap') return announce(parried, 'deflected');
  return announce(strikeTarget(parried, id, targetId, casterId, power, context), 'reflected');
}

/** Megumi renonce à la victoire : Mahoraga prend sa place sur le texte et court comme un bot. */
function summon(race: RaceState, casterId: string, { t }: Context): RaceState {
  const caster = racerOf(race, casterId);
  const seat: RacerSeat = { id: `mahoraga:${casterId}`, name: 'Mahoraga', avatar: null, kind: 'bot', level: null, summon: true };
  const { text, mode } = caster.typing;
  const typing = moveTo(startTyping(text, mode), caster.typing.input.length);
  const bot = createBot({ wpm: MAHORAGA_START_WPM, errorRate: MAHORAGA_ERROR_RATE, steady: true }, caster.bot.seed);
  const mahoraga: Racer = {
    ...caster,
    seat,
    driver: 'sim',
    typing: { ...typing, lastT: t },
    keys: startKeyTally(),
    energy: 0,
    status: 'racing',
    endedAt: null,
    bot: { ...bot, nextAt: bot.nextAt + t },
    disconnectedAt: null,
    powers: startPowers(),
    flashes: 0,
    revision: 0,
  };
  const left = change(race, casterId, () => ({ status: 'summoned', endedAt: t }));
  return notify({ ...left, racers: [...left.racers, mahoraga] }, { kind: 'summon', by: casterId, seat: seat.id });
}

function castTechnique(race: RaceState, id: TechniqueId, casterId: string, context: Context): RaceState {
  const chained = changePowers(race, casterId, ({ chain }) => ({ chain: [...chain, id].slice(-2) }));
  if (TECHNIQUE_EFFECTS[id].kind === 'summon') return summon(chained, casterId, context);
  if (isTargeted(id)) return attack(chained, id, casterId, context);
  return notify(strikeSelf(chained, id, casterId, context), { kind: 'cast', by: casterId, ability: id, target: null, outcome: 'self' });
}

function openDomain(race: RaceState, casterId: string, t: number): RaceState {
  const until = t + DOMAIN_SECONDS * 1000;
  const opened = changePowers(race, casterId, () => ({ domainUntil: until, domainPulseAt: t, lockedUntil: until + DOMAIN_LOCK_SECONDS * 1000 }));
  return notify(opened, { kind: 'domain', by: casterId, character: racerOf(race, casterId).character as DomainOwner, open: true });
}

function bindingVow(race: RaceState, casterId: string): RaceState {
  const vowed = changePowers(race, casterId, () => ({ vowed: true }));
  const moved = retype(vowed, casterId, (typing) => {
    const position = wordStartAt(typing.text, typing.input.length + Math.round(typing.text.length * BINDING_VOW_PROGRESS));
    return moveTo(typing, Math.max(typing.input.length, position));
  });
  return notify(moved, { kind: 'vow', by: casterId });
}

const spend = (energy: number, ability: CastAbility, character: Racer['character']) => {
  const technique = techniquesOf(character).find(({ id }) => id === ability);
  if (!technique) return energy;
  return technique.spendsAll ? 0 : energy - technique.cost;
};

export type CastRefusal = CastBlocker | 'notRacing' | 'noTarget';

function refusal(race: RaceState, racer: Racer | undefined, ability: CastAbility, t: number): CastRefusal | null {
  if (race.phase !== 'racing' || !racer || racer.status !== 'racing') return 'notRacing';
  const blocker = castBlocker({ character: racer.character, energy: racer.energy, powers: racer.powers, gameMode: race.gameMode }, ability, t);
  if (blocker) return blocker;
  const attacks = ability !== 'domain' && ability !== 'vow' && isTargeted(ability);
  return attacks && topHalf(race, racer.seat.id).length === 0 ? 'noTarget' : null;
}

/** Lancement demandé par `casterId` : la nouvelle course, et la raison du refus s'il y en a une (course alors inchangée). */
export function castAbility(race: RaceState, casterId: string, ability: CastAbility, t: number): { race: RaceState; refused: CastRefusal | null } {
  const racer = race.racers.find((candidate) => candidate.seat.id === casterId);
  const refused = refusal(race, racer, ability, t);
  if (refused || !racer) return { race, refused };

  const random = randomStream(race.rng);
  const context: Context = { t, random, words: race.text.split(' ') };
  const paid = race.gameMode === 'unlimitedCe' ? race : change(race, casterId, ({ energy, character }) => ({ energy: spend(energy, ability, character) }));
  const cast = ability === 'domain' ? openDomain(paid, casterId, t) : ability === 'vow' ? bindingVow(paid, casterId) : castTechnique(paid, ability, casterId, context);
  return { race: { ...cast, rng: random.seed() }, refused: null };
}

/** Immunisés contre les territoires : Maki (Restriction céleste) et qui esquive (Lapins d'évasion). */
const domainTargets = (race: RaceState, casterId: string, t: number) =>
  race.racers.filter(({ seat, status, character, powers }) => seat.id !== casterId && status === 'racing' && character !== 'maki' && powers.untouchableUntil <= t);

/** Technique déclenchée par un territoire : gratuite, sans parade, sur les seuls coureurs qui n'y sont pas immunisés. */
function domainTechnique(race: RaceState, id: TechniqueId, casterId: string, context: Context): RaceState {
  if (!isTargeted(id)) return strikeSelf(race, id, casterId, context);
  const targets = domainTargets(race, casterId, context.t);
  if (targets.length === 0) return race;
  return strikeTarget(race, id, casterId, context.random.pick(targets).seat.id, casterPower(race, casterId), context);
}

function domainPulse(race: RaceState, caster: Racer, context: Context): RaceState {
  const id = caster.seat.id;
  const others = domainTargets(race, id, context.t).map((racer) => racer.seat.id);
  switch (caster.character) {
    case 'gojo':
      return others.reduce((current, other) => stun(current, other, context.t, VOID_STUN_MS), race);
    case 'sukuna':
      return others.reduce((current, other) => addWords(current, other, 1, context), race);
    case 'megumi':
      return CHARACTER_ABILITIES.megumi.filter((ability) => ability.id !== 'mahoraga').reduce((current, { id: shikigami }) => domainTechnique(current, shikigami, id, context), race);
    case 'yuta':
      return domainTechnique(race, context.random.pick(CHARACTER_ABILITIES.yuta).id, id, context);
    default:
      return race;
  }
}

function closeDomain(race: RaceState, racer: Racer): RaceState {
  const closed = changePowers(race, racer.seat.id, () => ({ domainUntil: 0 }));
  return notify(closed, { kind: 'domain', by: racer.seat.id, character: racer.character as DomainOwner, open: false });
}

/** Fait passer les secondes des territoires ouverts jusqu'à `t` : effet, drain d'énergie, fermeture. */
export function runDomains(race: RaceState, t: number): RaceState {
  if (!race.racers.some(({ powers }) => powers.domainUntil > 0)) return race;
  const random = randomStream(race.rng);
  const context: Context = { t, random, words: race.text.split(' ') };

  let current = race;
  for (const { seat } of race.racers) {
    let racer = racerOf(current, seat.id);
    while (racer.powers.domainUntil > 0 && racer.status === 'racing' && racer.powers.domainPulseAt <= t && racer.powers.domainPulseAt < racer.powers.domainUntil) {
      current = domainPulse(current, racer, context);
      const pulsed = changePowers(current, seat.id, ({ domainPulseAt }) => ({ domainPulseAt: domainPulseAt + PULSE_MS }));
      current = race.gameMode === 'unlimitedCe' ? pulsed : change(pulsed, seat.id, ({ energy }) => ({ energy: Math.max(0, energy - DOMAIN_DRAIN) }));
      racer = racerOf(current, seat.id);
    }
    if (racer.powers.domainUntil > 0 && (t >= racer.powers.domainUntil || racer.status !== 'racing')) current = closeDomain(current, racer);
  }
  return { ...current, rng: random.seed() };
}

/** Black Flash tirés pendant la frappe (voir `strike`) : la cible est étourdie, le frappeur charge plus vite. */
export function resolveFlashes(race: RaceState, t: number): RaceState {
  if (!race.racers.some((racer) => racer.flashes > 0)) return race;
  const random = randomStream(race.rng);

  let current = race;
  for (const { seat, flashes } of race.racers) {
    if (flashes === 0) continue;
    current = change(current, seat.id, () => ({ flashes: 0 }));
    const targets = topHalf(current, seat.id).filter(({ powers }) => powers.untouchableUntil <= t);
    if (targets.length === 0) continue;
    const target = random.pick(targets).seat.id;
    const boosted = changePowers(receive(stun(current, target, t, BLACK_FLASH_STUN_MS), target), seat.id, () => ({ boostUntil: t + BOOST_MS }));
    current = notify(boosted, { kind: 'blackFlash', by: seat.id, target });
  }
  return { ...current, rng: random.seed() };
}

/** Attente avant le prochain lancement d'un bot. */
export const nextBotCast = (t: number, random: Random) => Math.round(t + BOT_CAST_MS.min + BOT_CAST_MS.spread * random.next());

/** Les bots lancent aux mêmes règles que les joueurs (BON-8), Mahoraga et le pacte exceptés. */
export function runBots(race: RaceState, t: number): RaceState {
  if (!race.bonus) return race;
  let current = race;
  for (const { seat, driver } of race.racers) {
    const racer = racerOf(current, seat.id);
    if (driver !== 'sim' || seat.summon || racer.status !== 'racing' || t < racer.nextCastAt) continue;

    const random = randomStream(current.rng);
    const available = (ability: CastAbility) => refusal(current, racer, ability, t) === null;
    const techniques = techniquesOf(racer.character).map(({ id }) => id).filter((id) => id !== 'mahoraga' && available(id));
    const domain = hasDomain(racer.character) && available('domain') && random.next() < BOT_DOMAIN_CHANCE;
    const choice: CastAbility | null = domain ? 'domain' : techniques.length > 0 ? random.pick(techniques) : null;
    const nextCastAt = choice ? nextBotCast(t, random) : t + BOT_RETRY_MS;

    const rolled = { ...current, rng: random.seed(), racers: current.racers.map((r) => (r.seat.id === seat.id ? { ...r, nextCastAt } : r)) };
    current = choice ? castAbility(rolled, seat.id, choice, t).race : rolled;
  }
  return current;
}
