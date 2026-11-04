'use client';

import { useTranslations } from 'next-intl';
import { CHARACTER_ABILITIES, type AbilityCharacter, type AbilityKey, type DomainOwner, type TechniqueId } from '@/game/abilities';

/** Clé des messages d'une capacité, `null` pour Boogie-Woogie qui n'a pas de carte. */
function abilityKey(id: TechniqueId): AbilityKey | null {
  const owners = Object.keys(CHARACTER_ABILITIES) as AbilityCharacter[];
  const owner = owners.find((character) => CHARACTER_ABILITIES[character].some((ability) => ability.id === id));
  return owner ? (`${owner}.items.${id}` as AbilityKey) : null;
}

// Noms affichés des capacités, dans la langue du joueur : c'est aussi ce qu'il doit taper.
export function useAbilityNames() {
  const tAbilities = useTranslations('Character.abilities');
  const tTechniques = useTranslations('Characters.techniques');
  const tDomains = useTranslations('Character.domains');
  return {
    technique: (id: TechniqueId) => {
      const key = abilityKey(id);
      return key ? tAbilities(`${key}.name`) : tTechniques('todo');
    },
    domain: (character: DomainOwner) => tDomains(character),
  };
}
