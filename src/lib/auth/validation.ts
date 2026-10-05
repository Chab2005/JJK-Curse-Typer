// Règles de saisie des comptes (AUTH-2). Logique pure, partagée par les formulaires et les actions serveur.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const DISPLAY_NAME_MAX = 32;

const USERNAME_CHARS = /^[A-Za-z0-9_-]+$/;

export type UsernameError = 'length' | 'characters';

/** Nom d'utilisateur : 3 à 20 caractères parmi lettres, chiffres, `_` et `-`. `null` si valide. */
export function validateUsername(raw: string): UsernameError | null {
  const name = raw.trim();
  if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) return 'length';
  return USERNAME_CHARS.test(name) ? null : 'characters';
}

/** Clé d'unicité d'un nom d'utilisateur : `Gojo` et `gojo` désignent le même compte. */
export function usernameKey(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validatePassword(password: string): 'length' | null {
  return password.length < PASSWORD_MIN || password.length > PASSWORD_MAX ? 'length' : null;
}

/** Nom affiché (comme sur Discord) : libre mais non vide, 32 caractères au plus. */
export function validateDisplayName(raw: string): 'length' | null {
  const name = raw.trim();
  return name.length < 1 || [...name].length > DISPLAY_NAME_MAX ? 'length' : null;
}
