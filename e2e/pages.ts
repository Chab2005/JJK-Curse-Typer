// Pages du site à parcourir : lobby et course de démonstration (hôte John_Kaisen), profil de démonstration.
export const PAGES = [
  { name: 'home', path: '/' },
  { name: 'lobbies', path: '/lobbies' },
  { name: 'leaderboard', path: '/leaderboard' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'profile', path: '/profile' },
  { name: 'profile-other', path: '/profile/Satoru_Infinity' },
  { name: 'lobby', path: '/lobby/SHJ-60S' },
  { name: 'lobby-spectate', path: '/lobby/SHJ-60S?spectate=1' },
  { name: 'race', path: '/lobby/SHJ-60S/race' },
  { name: 'not-found', path: '/FOOBAR' },
] as const;

/** Origine de chaque langue : anglais sur le domaine racine, français sur fr. (GEN-3). */
export const ORIGINS = { en: 'http://localhost:3000', fr: 'http://fr.localhost:3000' } as const;
