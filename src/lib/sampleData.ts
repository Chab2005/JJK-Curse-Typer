// Les données de démonstration (classement, lobbies, profils, top de l'accueil) n'existent qu'en développement
// et en test. En production, elles sont masquées jusqu'à ce que de vraies données les remplacent ;
// `SHOW_SAMPLE_DATA=1` les rallume (maquette ou démo publique). Pas de `server-only` : la room de course l'importe.
export function showSampleData(): boolean {
  return process.env.SHOW_SAMPLE_DATA === '1' || process.env.NODE_ENV !== 'production';
}
