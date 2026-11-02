// Règles des capacités en course (BON-*) : durée des territoires, pacte contraignant et raccourcis.
// Pour l'instant seuls le guide et les fiches les affichent ; la course ne les déclenche pas encore.

/** Une extension du territoire reste ouverte 10 s, et son effet se répète chaque seconde. */
export const DOMAIN_SECONDS = 10;

/** Pacte contraignant : renoncer à sa technique fait gagner d'un coup 30 % de la course. */
export const BINDING_VOW_PROGRESS = 0.3;

/** Touche à presser avec Alt ; pour un territoire ou une technique, il faut ensuite taper son nom exact. */
export const ABILITY_KEYS = {
  domain: 'Q',
  technique: 'W',
  vow: 'X',
} as const;

export type Ability = keyof typeof ABILITY_KEYS;
