// Schémas zod des entrées serveur autres que les messages WebSocket (TECH-07) : formulaires, actions, paramètres de route.
// Purs, sans I/O : les actions et les routes les appliquent avant toute logique, les messages d'erreur restent ceux de `validation.ts`.
import { z } from 'zod';
import { MAX_INVITES } from '@/components/lobby/lobbyAccess';
import { PASSWORD_MAX, USERNAME_MAX, USERNAME_MIN } from '@/lib/auth/validation';

/** Texte d'un champ : jamais un fichier, rogné. */
const field = (max: number) => z.string().max(max).transform((value) => value.trim());

/** Valeurs textuelles d'un `FormData` : un champ absent ou fichier n'y figure pas. */
function textEntries(form: FormData): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === 'string') entries[key] = value;
  return entries;
}

/** Valide un formulaire ; `null` si sa forme est mauvaise (champ manquant, fichier à la place d'un texte, trop long). */
export function parseForm<T extends z.ZodType>(schema: T, form: FormData): z.output<T> | null {
  const result = schema.safeParse(textEntries(form));
  return result.success ? result.data : null;
}

/** Inscription, connexion et fin d'OAuth : pseudo et mot de passe. Les règles fines (longueur, caractères) restent à `validation.ts`. */
export const credentialsSchema = z.object({ username: field(64), password: z.string().max(PASSWORD_MAX * 8) });

/** Pseudo d'invité choisi avant de rejoindre un lobby. */
export const guestNameSchema = field(64);

/** Paramètres : tous facultatifs (un champ absent vaut « vide »), mais bornés. */
export const settingsFormSchema = z.object({
  displayName: field(200).default(''),
  github: field(200).default(''),
  discord: field(200).default(''),
});

/** Code de lobby, `ABC-234` : six caractères en deux groupes, mis en majuscules. */
export const lobbyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);

export const inviteTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{22}$/);

/** Options de `joinLobbyAction` : rien d'autre que `spectate` et `invite`. Un jeton mal formé n'est pas une erreur (il vient de l'URL) : il est simplement ignoré plus loin. */
export const joinOptionsSchema = z.object({ spectate: z.boolean().optional(), invite: z.string().max(128).optional() }).strict().default({});

/** Nombre de liens à créer d'un coup. */
export const inviteCountSchema = z.number().int().min(1).max(MAX_INVITES);

export const providerSchema = z.enum(['discord', 'github']);

/** Segment `[username]` de l'URL d'un avatar : décodé, puis comme un pseudo de compte. */
export const usernameParamSchema = z
  .string()
  .max(USERNAME_MAX * 4)
  .transform((value, ctx) => {
    try {
      return decodeURIComponent(value);
    } catch {
      ctx.addIssue({ code: 'custom', message: 'bad encoding' });
      return z.NEVER;
    }
  })
  .pipe(z.string().min(USERNAME_MIN).max(USERNAME_MAX).regex(/^[A-Za-z0-9_-]+$/));
