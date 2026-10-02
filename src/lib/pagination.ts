// Pagination pure des listes (lobbies, classement). Pages numérotées à partir de 1.

export type Page<T> = { items: T[]; page: number; pageCount: number };

/** Découpe `items` en pages de `perPage` et renvoie la page `page`, ramenée entre 1 et la dernière. */
export function paginate<T>(items: readonly T[], page: number, perPage: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * perPage;
  return { items: items.slice(start, start + perPage), page: current, pageCount };
}

/** Numéro de page lu dans l'URL (`?page=3`) ; 1 s'il est absent ou invalide. */
export function parsePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  return Math.max(1, Number(value));
}
