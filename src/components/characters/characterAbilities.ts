import type { CharacterId } from '@/components/shared/characters';

// Capacités détaillées sous la fiche du personnage (/characters/<id>). Les règles vivent dans le moteur (src/game/abilities.ts) ;
// les noms et effets viennent des messages (Character.abilities.<personnage>.items.<id>).
import { CHARACTER_ABILITIES, type AbilityCharacter } from '@/game/abilities';

export { CHARACTER_ABILITIES };
export type { AbilityCharacter, AbilityDuration, AbilityId, AbilityKey, CharacterAbility } from '@/game/abilities';

export function hasAbilities(id: CharacterId): id is AbilityCharacter {
  return id in CHARACTER_ABILITIES;
}
