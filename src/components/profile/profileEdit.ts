// Validation du dialogue de modification du profil (PROF-1, PROF-3). Logique pure.

export interface ProfileEditInput {
  username: string;
  github: string;
  discord: string;
}

export type ProfileEditErrors = { username?: 'length' | 'characters'; github?: 'invalid'; discord?: 'invalid' };

const USERNAME_CHARS = /^[A-Za-z0-9_-]+$/;
const GITHUB_URL = /^https:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?$/;
const DISCORD_URL = /^https:\/\/(?:www\.)?(?:discord\.com\/users\/\d+|discord\.gg\/[\w-]+)\/?$/;
/** Nom d'utilisateur Discord : 2 à 32 caractères, minuscules, chiffres, `_` et `.`. */
const DISCORD_NAME = /^[a-z0-9_.]{2,32}$/;

/** Lien GitHub complété en `https://` ; chaîne vide si rien n'est saisi. */
export function normalizeGithub(input: string): string {
  const value = input.trim();
  if (!value) return '';
  return /^https?:\/\//.test(value) ? value.replace(/^http:/, 'https:') : `https://${value}`;
}

/** Pseudo GitHub tiré d'un lien de profil valide, sinon `null`. */
export function githubHandle(url: string): string | null {
  return GITHUB_URL.exec(url)?.[1] ?? null;
}

/** Lien cliquable pour un Discord saisi comme lien ; `null` pour un simple nom. */
export function discordHref(value: string): string | null {
  return DISCORD_URL.test(value) ? value : null;
}

export function validateProfileEdit({ username, github, discord }: ProfileEditInput): ProfileEditErrors {
  const errors: ProfileEditErrors = {};
  const name = username.trim();
  if (name.length < 3 || name.length > 20) errors.username = 'length';
  else if (!USERNAME_CHARS.test(name)) errors.username = 'characters';

  if (github.trim() && !githubHandle(normalizeGithub(github))) errors.github = 'invalid';

  const contact = discord.trim();
  if (contact && !discordHref(contact) && !DISCORD_NAME.test(contact.toLowerCase())) errors.discord = 'invalid';

  return errors;
}
