// Passages réels en mémoire (CONF-03). La course est lancée de façon synchrone : elle lit `cachedPassages()`, qui ne touche
// jamais la base, et `loadPassages()` remplit le cache en arrière-plan. Tant que rien n'est chargé (base absente, table vide),
// le générateur retombe sur le corpus fourni avec le code. Sans `server-only` : la room de course l'importe hors de Next.
import { getDb } from '@/db/client';
import { passages } from '@/db/schema';
import type { Passage } from '@/game/text/passages';

/** Durée de vie du cache : un passage ajouté en base est repris au bout de ce délai. */
export const PASSAGE_CACHE_MS = 10 * 60 * 1000;

interface Cache {
  passages: Passage[];
  loadedAt: number;
}

const shared = globalThis as { __passages?: Cache; __passagesLoading?: Promise<Passage[]> };

/** Passages déjà chargés, `undefined` s'il n'y en a pas (jamais chargés, ou table vide). */
export function cachedPassages(): Passage[] | undefined {
  // Un cache périmé sert encore (le prochain `loadPassages` le renouvelle) : mieux vaut un passage vieux de 10 minutes que le corpus de secours.
  const passages = shared.__passages?.passages;
  return passages && passages.length > 0 ? passages : undefined;
}

/** Lit la table si le cache est vide ou périmé ; en cas d'échec, garde les passages d'avant et ne lève rien. */
export function loadPassages(now = Date.now()): Promise<Passage[]> {
  const cache = shared.__passages;
  if (cache && cache.passages.length > 0 && now - cache.loadedAt <= PASSAGE_CACHE_MS) return Promise.resolve(cache.passages);
  shared.__passagesLoading ??= getDb()
    .select()
    .from(passages)
    .then((rows) => {
      const loaded = rows as Passage[];
      shared.__passages = { passages: loaded, loadedAt: now };
      return loaded;
    })
    .catch(() => shared.__passages?.passages ?? [])
    .finally(() => {
      shared.__passagesLoading = undefined;
    });
  return shared.__passagesLoading;
}

export function clearPassageCache() {
  shared.__passages = undefined;
  shared.__passagesLoading = undefined;
}
