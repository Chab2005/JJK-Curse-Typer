// Écrit l'état d'une recherche dans l'URL sans recharger la page.
// Next synchronise `useSearchParams` avec l'API History native.

/** `replace` pour la frappe dans un champ, `push` pour un choix que le bouton Retour doit annuler. */
export function writeSearch(query: string, mode: 'push' | 'replace'): void {
  const url = query ? `?${query}` : window.location.pathname;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}
