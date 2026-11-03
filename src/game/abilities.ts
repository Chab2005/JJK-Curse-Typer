// Règles des capacités en course (BON-*) : durée des territoires, pacte contraignant, raccourcis, modes de jeu
// et capacités de chaque personnage. Les noms et effets affichés viennent des messages (Character.abilities).
import { CHARACTERS, type CharacterId } from '@/components/shared/characters';
import type { RacerSeat } from './race';

/** Une extension du territoire reste ouverte 10 s, et son effet se répète chaque seconde. */
export const DOMAIN_SECONDS = 10;
/** Énergie minimale pour déployer un territoire. */
export const DOMAIN_MIN_ENERGY = 1000;
/** Énergie drainée à chaque seconde d'ouverture : le minimum requis, sur toute la durée. */
export const DOMAIN_DRAIN = DOMAIN_MIN_ENERGY / DOMAIN_SECONDS;
/** Durée pendant laquelle techniques et territoire restent bloqués après la fermeture. */
export const DOMAIN_LOCK_SECONDS = 10;
/** Personnages qui ont une extension du territoire. */
export const DOMAIN_CHARACTERS = ['gojo', 'megumi', 'yuta', 'sukuna'] as const satisfies readonly CharacterId[];
export type DomainOwner = (typeof DOMAIN_CHARACTERS)[number];

/** Pacte contraignant : renoncer à sa technique fait gagner d'un coup 30 % de la course. */
export const BINDING_VOW_PROGRESS = 0.3;

/** Touche à presser avec Alt ; pour un territoire ou une technique, il faut ensuite taper son nom exact. */
export const ABILITY_KEYS = {
  domain: 'Q',
  technique: 'W',
  vow: 'X',
} as const;

export type Ability = keyof typeof ABILITY_KEYS;

/** Modes de jeu : normal, énergie illimitée, sans territoire, ou Restriction céleste (ni énergie ni capacité, BON-1). */
export const GAME_MODES = ['normal', 'unlimitedCe', 'noDomain', 'heavenly'] as const;
export type GameMode = (typeof GAME_MODES)[number];

/** Le mode Restriction céleste est une course sans bonus (H-7). */
export const modeHasBonus = (mode: GameMode) => mode !== 'heavenly';

// Capacités d'une technique : coût en énergie occulte et durée.
export type AbilityDuration = 'instant' | 'seconds' | 'secondsRange' | 'untilUsed' | 'nextWord' | 'nextWords' | 'restOfRace';

/** Personnages dont la technique a des capacités détaillées, et leurs identifiants (clés des messages). */
type AbilityIds = {
  yuji: 'divergentFist' | 'blackFlash';
  megumi: 'rabbitEscape' | 'toad' | 'maxElephant' | 'nue' | 'roundDeer' | 'divineDogs' | 'mahoraga';
  nobara: 'resonance' | 'hairpin';
  gojo: 'blue' | 'red' | 'purple';
  sukuna: 'cleave' | 'dismantle' | 'divineFlames';
  /** Techniques copiées par Rika : celles d'Inumaki (Parole maudite), de Kirara (Échelle de Jacob) et d'Uro (Manipulation du ciel). */
  yuta: 'jacobsLadder' | 'cursedSpeech' | 'skyManipulation';
};
export type AbilityCharacter = keyof AbilityIds;
export type AbilityId = AbilityIds[AbilityCharacter];
/** Clé des messages d'une capacité, sous Character.abilities. */
export type AbilityKey = { [C in AbilityCharacter]: `${C}.items.${AbilityIds[C]}` }[AbilityCharacter];

export type CharacterAbility = {
  id: AbilityId;
  /** Coût en énergie occulte ; le minimum à avoir quand `spendsAll` vide toute la barre. */
  cost: number;
  spendsAll?: boolean;
  duration: AbilityDuration;
  /** Pour une durée `seconds`, ou le minimum d'une durée `secondsRange`. */
  seconds?: number;
  /** Maximum d'une durée `secondsRange`. */
  maxSeconds?: number;
  /** Pour une durée `nextWords` : combien de mots suivants sont touchés. */
  words?: number;
  /** Capacités à enchaîner, dans l'ordre, juste avant celle-ci ; si la chaîne est rompue, elle n'est pas disponible. */
  requires?: readonly AbilityId[];
  /** Carte mise en avant, seule et centrée sur la dernière rangée. */
  featured?: boolean;
};

export const CHARACTER_ABILITIES: Record<AbilityCharacter, readonly CharacterAbility[]> = {
  yuji: [
    { id: 'divergentFist', cost: 200, duration: 'secondsRange', seconds: 2, maxSeconds: 3 },
    { id: 'blackFlash', cost: 150, duration: 'secondsRange', seconds: 2, maxSeconds: 3 },
  ],
  megumi: [
    { id: 'rabbitEscape', cost: 100, duration: 'seconds', seconds: 3 },
    { id: 'toad', cost: 450, duration: 'instant' },
    { id: 'maxElephant', cost: 450, duration: 'instant' },
    { id: 'nue', cost: 400, duration: 'seconds', seconds: 3 },
    { id: 'roundDeer', cost: 250, duration: 'untilUsed' },
    { id: 'divineDogs', cost: 100, duration: 'nextWord' },
    { id: 'mahoraga', cost: 1000, spendsAll: true, duration: 'restOfRace', featured: true },
  ],
  nobara: [
    { id: 'resonance', cost: 350, duration: 'secondsRange', seconds: 3, maxSeconds: 5 },
    { id: 'hairpin', cost: 250, duration: 'instant' },
  ],
  gojo: [
    { id: 'blue', cost: 300, duration: 'secondsRange', seconds: 3, maxSeconds: 5 },
    { id: 'red', cost: 250, duration: 'untilUsed' },
    { id: 'purple', cost: 500, duration: 'instant', featured: true },
  ],
  sukuna: [
    { id: 'cleave', cost: 250, duration: 'nextWord' },
    { id: 'dismantle', cost: 300, duration: 'nextWord' },
    { id: 'divineFlames', cost: 250, duration: 'nextWords', words: 3, requires: ['cleave', 'dismantle'], featured: true },
  ],
  yuta: [
    { id: 'jacobsLadder', cost: 250, duration: 'secondsRange', seconds: 3, maxSeconds: 5 },
    { id: 'cursedSpeech', cost: 300, duration: 'secondsRange', seconds: 3, maxSeconds: 5 },
    { id: 'skyManipulation', cost: 200, duration: 'untilUsed' },
  ],
};

/** Technique de Todo : pas de carte de capacités sur sa fiche, elle a sa propre démonstration. */
export const BOOGIE_WOOGIE: { id: 'boogieWoogie'; cost: number } = { id: 'boogieWoogie', cost: 400 };

export type TechniqueId = AbilityId | typeof BOOGIE_WOOGIE.id;

/** Ce qu'une technique fait à sa cible ou à son lanceur. Les durées viennent de CHARACTER_ABILITIES. */
export type TechniqueEffect =
  | { kind: 'stun'; boost?: boolean }
  | { kind: 'lag' }
  | { kind: 'seal' }
  /** Mots ajoutés à la cible, entre `min` et `max` selon le retard du lanceur. */
  | { kind: 'addWords'; min: number; max: number }
  | { kind: 'loseWords'; words: number }
  | { kind: 'swap' }
  /** Mots que le lanceur saute. */
  | { kind: 'skipWords'; words: number }
  | { kind: 'ward'; ward: Ward }
  | { kind: 'untouchable' }
  | { kind: 'summon' };

/** `deflect` annule la prochaine attaque ; `reflect` la renvoie à son lanceur. */
export type Ward = 'deflect' | 'reflect';

export const TECHNIQUE_EFFECTS: Record<TechniqueId, TechniqueEffect> = {
  divergentFist: { kind: 'lag' },
  blackFlash: { kind: 'stun', boost: true },
  rabbitEscape: { kind: 'untouchable' },
  toad: { kind: 'loseWords', words: 1 },
  maxElephant: { kind: 'skipWords', words: 1 },
  nue: { kind: 'stun' },
  roundDeer: { kind: 'ward', ward: 'reflect' },
  divineDogs: { kind: 'skipWords', words: 1 },
  mahoraga: { kind: 'summon' },
  resonance: { kind: 'stun' },
  hairpin: { kind: 'addWords', min: 2, max: 4 },
  blue: { kind: 'stun' },
  red: { kind: 'ward', ward: 'deflect' },
  purple: { kind: 'skipWords', words: 2 },
  cleave: { kind: 'skipWords', words: 1 },
  dismantle: { kind: 'skipWords', words: 1 },
  divineFlames: { kind: 'skipWords', words: 3 },
  jacobsLadder: { kind: 'seal' },
  cursedSpeech: { kind: 'stun' },
  skyManipulation: { kind: 'ward', ward: 'reflect' },
  boogieWoogie: { kind: 'swap' },
};

/** Tout ce qu'un joueur peut demander à la room. */
export const CAST_ABILITIES = ['domain', 'vow', ...(Object.keys(TECHNIQUE_EFFECTS) as TechniqueId[])] as const;
export type CastAbility = TechniqueId | 'domain' | 'vow';

/** Technique touchant un autre coureur (les autres agissent sur le lanceur). */
export const isTargeted = (id: TechniqueId) => !['skipWords', 'ward', 'untouchable', 'summon'].includes(TECHNIQUE_EFFECTS[id].kind);

/** Personnage du coureur : celui qu'il a choisi, sinon (bot, compte sans personnage) un personnage stable tiré de son siège. */
export function racerCharacter(seat: RacerSeat): CharacterId {
  if (seat.avatar) return seat.avatar;
  const hash = [...seat.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return CHARACTERS[hash % CHARACTERS.length].id;
}
