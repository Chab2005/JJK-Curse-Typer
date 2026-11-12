// Logique pure de l'écran de course : ce que le client retient des messages de la room,
// la place de chacun sur la piste et l'état de chaque caractère du texte.
import type { RaceSnapshot, ServerMessage } from '@/game/protocol';
import type { CharacterId } from '@/components/shared/characters';
import { racerCharacter, type DomainOwner, type TechniqueId } from '@/game/abilities';
import { LAG_MS, type RacerMark } from '@/game/powers';
import { parseRecordSeats } from '@/game/personalBest';
import type { SeriesEntry } from '@/game/series';
import { overtakes, type RaceNotice, type RacePhase, type RacerSeat, type RacerStatus, type Standing } from '@/game/race';

/** Annonce affichée dans la zone d'animation (RACE-3, RACE-5). */
export type RaceBanner = { kind: 'passed' | 'passedBy' | 'newLeader'; ids: string[]; at: number };

/** Coup à dessiner sur la piste. */
export type RaceHit = { target: string; ability: TechniqueId; at: number };

export interface RaceView {
  /** Siège du joueur, `null` en spectateur. */
  you: string | null;
  race: RaceSnapshot | null;
  /** Heure de départ sur l'horloge locale (ms epoch). */
  startAt: number | null;
  phase: RacePhase | null;
  standings: Standing[];
  banner: RaceBanner | null;
  /** Heure locale du dernier tick où chaque coureur a avancé : son personnage court tant qu'elle est récente. */
  movedAt: Record<string, number>;
  /** Dernière capacité annoncée (BONUS-03) et heure locale de l'annonce. */
  notice: { notice: RaceNotice; at: number } | null;
  hits: RaceHit[];
  /** Séries du MPM et touches ratées de tous, reçues une fois la course finie (RES-03). */
  series: SeriesEntry[];
  /** Sièges qui ont battu leur record personnel, annoncés après l'enregistrement de la course (RES-04). */
  records: string[];
  /** Territoires ouverts, par lanceur. */
  domains: Record<string, DomainOwner>;
}

export const initialRaceView: RaceView = { you: null, race: null, startAt: null, phase: null, standings: [], banner: null, movedAt: {}, notice: null, hits: [], series: [], records: [], domains: {} };

/** Un coup reste dessiné sur la piste 900 ms. */
export const HIT_MS = 900;

/** Coureurs dont la progression a augmenté depuis le tick précédent, notés à `at`. */
function nextMovedAt(view: RaceView, standings: Standing[], at: number): Record<string, number> {
  const before = new Map(view.standings.map((s) => [s.id, s.progress]));
  const moved = standings.filter((s) => s.progress > (before.get(s.id) ?? 0));
  return moved.length === 0 ? view.movedAt : { ...view.movedAt, ...Object.fromEntries(moved.map((s) => [s.id, at])) };
}

function nextBanner(view: RaceView, standings: Standing[], at: number): RaceBanner | null {
  if (view.standings.length === 0) return view.banner;
  if (view.you) {
    const { passed, passedBy } = overtakes(view.standings, standings, view.you);
    if (passed.length > 0) return { kind: 'passed', ids: passed, at };
    if (passedBy.length > 0) return { kind: 'passedBy', ids: passedBy, at };
  }
  // Nouveau meneur seulement s'il devance vraiment l'ancien : une égalité ne fait que changer l'ordre.
  const leader = standings[0];
  const formerLeader = standings.find((s) => s.id === view.standings[0].id);
  if (leader && formerLeader && leader.id !== formerLeader.id && leader.progress > formerLeader.progress) return { kind: 'newLeader', ids: [leader.id], at };
  return view.banner;
}

/** Ce que les annonces d'un tick changent à la vue. */
function withNotices(view: RaceView, notices: readonly RaceNotice[], at: number): Pick<RaceView, 'notice' | 'hits' | 'domains'> {
  const hits = view.hits.filter((hit) => at - hit.at < HIT_MS);
  const domains = { ...view.domains };
  for (const notice of notices) {
    if (notice.kind === 'cast' && notice.target && notice.outcome !== 'dodged') hits.push({ target: notice.target, ability: notice.ability, at });
    if (notice.kind === 'blackFlash') hits.push({ target: notice.target, ability: 'blackFlash', at });
    if (notice.kind === 'domain' && notice.open) domains[notice.by] = notice.character;
    if (notice.kind === 'domain' && !notice.open) delete domains[notice.by];
  }
  const last = notices.at(-1);
  return { notice: last ? { notice: last, at } : view.notice, hits, domains };
}

/** Message de la room reçu à `receivedAt` (horloge locale) → nouvelle vue. */
export function raceViewReducer(view: RaceView, message: ServerMessage, receivedAt: number): RaceView {
  switch (message.type) {
    case 'welcome':
      return { ...initialRaceView, you: message.you, race: message.race, startAt: receivedAt + message.race.startsIn, phase: message.race.phase };
    case 'tick': {
      if (!view.race) return view;
      // Chaque tick estime l'heure de départ ; la plus précoce est celle qui a le moins souffert du réseau.
      const startAt = Math.min(view.startAt ?? Infinity, receivedAt - message.elapsed);
      const banner = message.phase === 'racing' ? nextBanner(view, message.standings, receivedAt) : view.banner;
      return {
        ...view,
        ...withNotices(view, message.notices ?? [], receivedAt),
        startAt,
        phase: message.phase,
        standings: message.standings,
        banner,
        movedAt: nextMovedAt(view, message.standings, receivedAt),
      };
    }
    case 'series':
      return { ...view, series: message.series };
    case 'records':
      return { ...view, records: parseRecordSeats(message.seats) };
    case 'seats':
      return view.race ? { ...view, race: { ...view.race, seats: message.seats } } : view;
    case 'resync':
    case 'sync':
    case 'castRefused':
      return view;
  }
}

/** Saisie du joueur juste avant et juste après une frappe, pour rejouer l'affichage en retard. */
export type TrailEntry = { at: number; before: string; input: string };

/** Sous Poing divergent, ce que le joueur voit de sa saisie à `now` : ses frappes arrivent LAG_MS plus tard. */
export function laggedInput(trail: readonly TrailEntry[], now: number, current: string): string {
  if (trail.length === 0) return current;
  const shown = trail.findLast((entry) => entry.at <= now - LAG_MS);
  return shown ? shown.input : trail[0].before;
}

/** Garde de la trace ce qui peut encore s'afficher. */
export const trimTrail = (trail: readonly TrailEntry[], now: number): TrailEntry[] => trail.filter((entry) => entry.at > now - 2 * LAG_MS);

/** Rangs de la piste : les participants y sont répartis pour moins se chevaucher. */
const LANES = 3;

export interface TrackRunner {
  seat: RacerSeat;
  /** Position sur la piste, de 0 (départ) à 1 (arrivée). */
  x: number;
  rank: number;
  wpm: number;
  status: RacerStatus;
  leader: boolean;
  you: boolean;
  /** Le meneur et le joueur sont dessinés plus gros (maquette « Course »). */
  big: boolean;
  lane: number;
  /** Personnage dessiné sur la piste. */
  character: CharacterId;
  /** Le personnage court (il vient d'avancer, ou le joueur tape) ; sinon il est au repos (idle). */
  running: boolean;
  marks: RacerMark[];
}

/** Un personnage court encore RUN_MS après son dernier pas : les ticks arrivent toutes les 200 ms. */
export const RUN_MS = 600;

/** Horloge locale (`now`), derniers pas vus dans les ticks (`movedAt`) et dernière frappe du joueur (`youTypedAt`). */
export interface TrackMotion {
  now: number;
  movedAt: Record<string, number>;
  youTypedAt: number | null;
}

const STILL: TrackMotion = { now: 0, movedAt: {}, youTypedAt: null };

export const runnerCharacter = racerCharacter;

/** Qui court en ce moment : le joueur dès qu'il tape, les autres quand la room les voit avancer. Une clé stable (ids joints) : elle ne change que quand quelqu'un se met à courir ou s'arrête. */
export function runningKey(seats: readonly RacerSeat[], standings: readonly Standing[], you: string | null, motion: TrackMotion): string {
  const byId = new Map(standings.map((s) => [s.id, s]));
  return seats
    .filter((seat) => {
      const status = byId.get(seat.id)?.status ?? 'racing';
      const lastMove = seat.id === you ? motion.youTypedAt : motion.movedAt[seat.id];
      return status === 'racing' && lastMove != null && motion.now - lastMove < RUN_MS;
    })
    .map((seat) => seat.id)
    .join(RUNNING_SEPARATOR);
}

const RUNNING_SEPARATOR = '\u0000';
const NOBODY: ReadonlySet<string> = new Set();

export const runningSet = (key: string): ReadonlySet<string> => (key === '' ? NOBODY : new Set(key.split(RUNNING_SEPARATOR)));

/** Coureurs de la piste. `running` : ceux qui courent (voir `runningKey`) ; sans lui, personne n'est dessiné en train de courir. */
export function trackRunnersFor(seats: readonly RacerSeat[], standings: readonly Standing[], you: string | null, textLength: number, running: ReadonlySet<string> = NOBODY): TrackRunner[] {
  const byId = new Map(standings.map((s) => [s.id, s]));
  return seats.map((seat, i) => {
    const standing = byId.get(seat.id);
    const status = standing?.status ?? 'racing';
    const progress = standing?.progress ?? 0;
    const total = standing?.total ?? textLength;
    const x = status === 'finished' ? 1 : total > 0 ? progress / total : 0;
    // Pas de meneur tant que personne n'a tapé un caractère juste.
    const leader = standing?.rank === 1 && (progress > 0 || status === 'finished');
    const isYou = seat.id === you;
    return { seat, x, rank: standing?.rank ?? i + 1, wpm: standing?.wpm ?? 0, status, leader, you: isYou, big: leader || isYou, lane: i % LANES, character: runnerCharacter(seat), running: running.has(seat.id), marks: standing?.marks ?? [] };
  });
}

export function trackRunners(seats: readonly RacerSeat[], standings: readonly Standing[], you: string | null, textLength: number, motion: TrackMotion = STILL): TrackRunner[] {
  return trackRunnersFor(seats, standings, you, textLength, runningSet(runningKey(seats, standings, you, motion)));
}

export type CharState = 'correct' | 'wrong' | 'pending';

export function charState(text: string, input: string, index: number): CharState {
  if (index >= input.length) return 'pending';
  return input[index] === text[index] ? 'correct' : 'wrong';
}

/** Mots du texte avec leur espace finale : la ligne ne se coupe qu'entre deux mots. */
export function splitWords(text: string): { start: number; chars: string }[] {
  const words: { start: number; chars: string }[] = [];
  for (const match of text.matchAll(/\S+\s?|\s/g)) words.push({ start: match.index, chars: match[0] });
  return words;
}

/** Durée en m:ss. */
export function formatClock(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
