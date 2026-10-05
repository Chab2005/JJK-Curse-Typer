// Hasard seedé (mulberry32) : même graine → même suite, sur le client comme dans la room.

export type Seed = number;

/** Nombre dans [0, 1) et graine suivante. */
export function nextRandom(seed: Seed): [number, Seed] {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(next ^ (next >>> 15), next | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/**
 * Suite de tirages pour le code qui en enchaîne beaucoup (génération de texte, bots).
 * La graine ne vit que dans la fonction appelante : celle-ci reste pure vue de l'extérieur.
 */
export function randomStream(seed: Seed) {
  let current = seed >>> 0;
  const next = () => {
    const [value, following] = nextRandom(current);
    current = following;
    return value;
  };
  return {
    next,
    /** Entier dans [0, max). */
    int: (max: number) => Math.floor(next() * max),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    /** Graine à reprendre pour continuer la suite plus tard. */
    seed: () => current,
  };
}

/** Graine tirée d'un texte (FNV-1a). */
export function hashSeed(text: string): Seed {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return hash >>> 0;
}
