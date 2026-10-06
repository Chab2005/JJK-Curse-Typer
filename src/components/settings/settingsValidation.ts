// Validation du formulaire des paramètres (PROF-3, PROF-4, PROF-5), enregistré d'un seul bouton. Logique pure.
import { validateLinks } from '@/components/profile/profileEdit';
import { validateAvatarFile } from '@/lib/auth/avatar';
import { validateDisplayName } from '@/lib/auth/validation';

export interface SettingsInput {
  displayName: string;
  github: string;
  discord: string;
  /** Octets de la nouvelle photo ; `null` si aucune n'est choisie. */
  avatar: Uint8Array | null;
}

/** Erreurs par champ ; chaque valeur est une clé de `Settings.errors`. */
export type SettingsErrors = {
  displayName?: 'displayName';
  github?: 'github';
  discord?: 'discord';
  avatar?: 'avatarType' | 'avatarSize' | 'avatarInvalid';
};

export function validateSettings({ displayName, github, discord, avatar }: SettingsInput): SettingsErrors {
  const errors: SettingsErrors = {};
  if (validateDisplayName(displayName)) errors.displayName = 'displayName';
  const links = validateLinks({ github, discord });
  if (links.github) errors.github = 'github';
  if (links.discord) errors.discord = 'discord';
  const problem = avatar ? validateAvatarFile(avatar) : null;
  if (problem) errors.avatar = problem === 'size' ? 'avatarSize' : 'avatarType';
  return errors;
}
