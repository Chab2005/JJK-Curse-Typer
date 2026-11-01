import { CHARACTERS, type Character, type CharacterId } from '@/components/shared/characters';

// Navigation entre les fiches de /characters (logique pure).

/** Personnage dont l'identifiant est exactement `id`, sinon `undefined` (fiche introuvable). */
export function findCharacter(id: string): Character | undefined {
  return CHARACTERS.find((character) => character.id === id);
}

/** Fiches précédente et suivante ; la liste boucle aux deux bouts. */
export function neighbours(id: CharacterId): { prev: Character; next: Character } {
  const index = CHARACTERS.findIndex((character) => character.id === id);
  const count = CHARACTERS.length;
  return { prev: CHARACTERS[(index - 1 + count) % count], next: CHARACTERS[(index + 1) % count] };
}
