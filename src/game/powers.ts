// État des capacités d'un coureur et règles de lancement (BON-*). Fonctions pures, partagées : la room y valide
// chaque lancement, l'écran de course y lit ce qui est disponible. Les instants sont en ms depuis le départ.
import type { CharacterId } from '@/components/shared/characters';
import {
  BOOGIE_WOOGIE,
  CHARACTER_ABILITIES,
  DOMAIN_CHARACTERS,
  DOMAIN_MIN_ENERGY,
  type CastAbility,
  type CharacterAbility,
  type DomainOwner,
  type GameMode,
  type TechniqueId,
  type Ward,
} from './abilities';

/** Coups de Black Flash : chance par caractère juste, étourdissement de la cible. */
export const BLACK_FLASH_CHANCE = 0.004;
export const BLACK_FLASH_STUN_MS = 1500;
/** Accumulation d'énergie doublée pendant 8 s après un Black Flash. */
export const BOOST_RATE = 2;
export const BOOST_MS = 8000;
/** Retard d'affichage de la frappe sous Poing divergent, et temps perdu par frappe pour un bot. */
export const LAG_MS = 350;

export interface RacerPowers {
  stun: { from: number; until: number } | null;
  lagUntil: number;
  sealedUntil: number;
  untouchableUntil: number;
  /** Techniques et territoire bloqués : pendant le territoire, puis DOMAIN_LOCK_SECONDS. */
  lockedUntil: number;
  boostUntil: number;
  /** Fin du territoire ouvert, 0 s'il n'y en a pas. */
  domainUntil: number;
  /** Prochaine seconde d'effet du territoire. */
  domainPulseAt: number;
  ward: Ward | null;
  vowed: boolean;
  /** Deux dernières techniques lancées : Flammes divines s'y enchaîne. */
  chain: TechniqueId[];
}

export const startPowers = (): RacerPowers => ({
  stun: null,
  lagUntil: 0,
  sealedUntil: 0,
  untouchableUntil: 0,
  lockedUntil: 0,
  boostUntil: 0,
  domainUntil: 0,
  domainPulseAt: 0,
  ward: null,
  vowed: false,
  chain: [],
});

/** Maki est née sans énergie occulte : ni jauge, ni technique, ni Black Flash. */
export const hasCursedEnergy = (character: CharacterId) => character !== 'maki';

export const hasDomain = (character: CharacterId): character is DomainOwner => (DOMAIN_CHARACTERS as readonly CharacterId[]).includes(character);

type Technique = Pick<CharacterAbility, 'cost' | 'spendsAll' | 'requires'> & { id: TechniqueId };

export function techniquesOf(character: CharacterId): readonly Technique[] {
  if (character === 'todo') return [BOOGIE_WOOGIE];
  return character === 'maki' ? [] : CHARACTER_ABILITIES[character];
}

export const stunnedAt = ({ stun }: RacerPowers, t: number) => stun !== null && t >= stun.from && t < stun.until;

export type CastBlocker = 'mode' | 'none' | 'energy' | 'stunned' | 'sealed' | 'locked' | 'domainOpen' | 'vowed' | 'chain';

/** Ce que la règle a besoin de savoir d'un lanceur : un `Racer` côté room, le joueur côté écran. */
export interface CasterView {
  character: CharacterId;
  energy: number;
  powers: RacerPowers;
  gameMode: GameMode;
}

/** Raison qui empêche de lancer `ability` à l'instant `t`, ou `null` si c'est possible. */
export function castBlocker({ character, energy, powers, gameMode }: CasterView, ability: CastAbility, t: number): CastBlocker | null {
  if (gameMode === 'heavenly') return 'mode';
  if (!hasCursedEnergy(character)) return 'none';
  if (stunnedAt(powers, t)) return 'stunned';
  if (ability === 'vow') return powers.vowed ? 'vowed' : null;
  if (powers.sealedUntil > t) return 'sealed';
  if (powers.domainUntil > t) return 'domainOpen';
  if (powers.lockedUntil > t) return 'locked';

  if (ability === 'domain') {
    if (gameMode === 'noDomain') return 'mode';
    if (!hasDomain(character)) return 'none';
    return energy >= DOMAIN_MIN_ENERGY ? null : 'energy';
  }

  const technique = techniquesOf(character).find(({ id }) => id === ability);
  if (!technique) return 'none';
  if (powers.vowed) return 'vowed';
  if (technique.requires && technique.requires.some((id, i) => powers.chain[i] !== id)) return 'chain';
  return energy >= technique.cost ? null : 'energy';
}

/** État visible d'un coureur, sur la piste et dans le classement. */
export type RacerMark = 'stunned' | 'lagging' | 'sealed' | 'untouchable' | 'warded' | 'boosted' | 'domain';

export function racerMarks(powers: RacerPowers, t: number): RacerMark[] {
  const marks: [RacerMark, boolean][] = [
    ['stunned', stunnedAt(powers, t)],
    ['lagging', powers.lagUntil > t],
    ['sealed', powers.sealedUntil > t],
    ['untouchable', powers.untouchableUntil > t],
    ['warded', powers.ward !== null],
    ['boosted', powers.boostUntil > t],
    ['domain', powers.domainUntil > t],
  ];
  return marks.filter(([, on]) => on).map(([mark]) => mark);
}
