// Pages du site à parcourir : lobby et course de démonstration (hôte John_Kaisen), profil de démonstration.
export const PAGES = [
  { name: 'home', path: '/' },
  { name: 'lobbies', path: '/lobbies' },
  { name: 'leaderboard', path: '/leaderboard' },
  { name: 'characters', path: '/characters' },
  { name: 'character', path: '/characters/gojo' },
  { name: 'character-megumi', path: '/characters/megumi' },
  { name: 'character-yuta', path: '/characters/yuta' },
  { name: 'character-sukuna', path: '/characters/sukuna' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'profile', path: '/profile' },
  { name: 'profile-other', path: '/profile/Satoru_Infinity' },
  // Historique (HIST-01) : sans session, la page renvoie à la connexion ; une course inconnue répond 404 (HIST-02).
  { name: 'history', path: '/history' },
  { name: 'history-race', path: '/history/1' },
  { name: 'lobby', path: '/lobby/SHJ-60S' },
  { name: 'lobby-spectate', path: '/lobby/SHJ-60S?spectate=1' },
  { name: 'race', path: '/lobby/SHJ-60S/race' },
  { name: 'not-found', path: '/FOOBAR' },
] as const;

/** Préfixe de chemin de chaque langue : anglais sans préfixe, français sous /fr (GEN-3). */
export const LOCALE_PREFIXES = { en: '', fr: '/fr' } as const;
