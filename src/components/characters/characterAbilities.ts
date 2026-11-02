import type { CharacterId } from '@/components/shared/characters';

// Capacités d'une technique, détaillées sous la fiche du personnage (/characters/<id>) : coût en énergie occulte
// et durée. Les noms et effets viennent des messages (Character.abilities.<personnage>.items.<id>).
export type AbilityDuration = 'instant' | 'seconds' | 'untilUsed' | 'nextWord' | 'restOfRace';

/** Personnages dont la technique a des capacités détaillées, et leurs identifiants (clés des messages). */
export type AbilityCharacter = 'megumi';
export type AbilityId = 'rabbitEscape' | 'toad' | 'maxElephant' | 'nue' | 'roundDeer' | 'divineDogs' | 'mahoraga';

export type CharacterAbility = {
  id: AbilityId;
  /** Coût en énergie occulte ; le minimum à avoir quand `spendsAll` vide toute la barre. */
  cost: number;
  spendsAll?: boolean;
  duration: AbilityDuration;
  /** Pour une durée `seconds`. */
  seconds?: number;
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
};

export function hasAbilities(id: CharacterId): id is AbilityCharacter {
  return id in CHARACTER_ABILITIES;
}
