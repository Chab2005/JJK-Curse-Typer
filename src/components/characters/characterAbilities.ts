import type { CharacterId } from '@/components/shared/characters';

// Capacités d'une technique, détaillées sous la fiche du personnage (/characters/<id>) : coût en énergie occulte
// et durée. Les noms et effets viennent des messages (Character.abilities.<personnage>.items.<id>).
export type AbilityDuration = 'instant' | 'seconds' | 'secondsRange' | 'untilUsed' | 'nextWord' | 'nextWords' | 'restOfRace';

/** Personnages dont la technique a des capacités détaillées, et leurs identifiants (clés des messages). */
type AbilityIds = {
  megumi: 'rabbitEscape' | 'toad' | 'maxElephant' | 'nue' | 'roundDeer' | 'divineDogs' | 'mahoraga';
  nobara: 'resonance' | 'hairpin';
  gojo: 'blue' | 'red' | 'purple';
  sukuna: 'cleave' | 'dismantle' | 'divineFlames';
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
};

export function hasAbilities(id: CharacterId): id is AbilityCharacter {
  return id in CHARACTER_ABILITIES;
}
