'use server';

import { createHash } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { getLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import sharp from 'sharp';
import { db } from '@/db';
import { oauthPending, users } from '@/db/schema';
import { normalizeGithub, validateLinks } from '@/components/profile/profileEdit';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { attachGuestGames, createAccount, findUserByUsername } from '@/lib/auth/accounts';
import { anyBlocked, attemptKeys, clearFailures, recordFailure } from '@/lib/auth/attempts';
import { AVATAR_SIZE, validateAvatarFile } from '@/lib/auth/avatar';
import { OAUTH_PENDING_COOKIE } from '@/lib/auth/config';
import { clearGuest, countryFromHeaders, getGuest, setGuest } from '@/lib/auth/guestCookie';
import { dummyVerify, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession, getSessionUser } from '@/lib/auth/session';
import { validateDisplayName, validatePassword, validateUsername } from '@/lib/auth/validation';

// Actions serveur de l'authentification (AUTH-1 à AUTH-8) et du profil (PROF-3, PROF-5).
// Elles répondent par un code d'erreur que l'interface traduit ; en cas de succès, elles redirigent.

export type AuthState = { error?: 'username' | 'usernameChars' | 'password' | 'taken' | 'invalid' | 'blocked' | 'expired'; username?: string } | null;

const text = (form: FormData, key: string) => (typeof form.get(key) === 'string' ? (form.get(key) as string) : '');

async function goHome(): Promise<never> {
  return redirect({ href: '/', locale: (await getLocale()) as Locale });
}

function checkCredentials(username: string, password: string): AuthState {
  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError === 'length' ? 'username' : 'usernameChars', username };
  if (validatePassword(password)) return { error: 'password', username };
  return null;
}

/** Inscription par pseudo et mot de passe (AUTH-2). Les courses de l'invité passent au compte (STAT-7). */
export async function registerAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const username = text(form, 'username').trim();
  const password = text(form, 'password');
  const invalid = checkCredentials(username, password);
  if (invalid) return invalid;

  const guest = await getGuest();
  const result = await createAccount({ username, password, guest, country: await countryFromHeaders() });
  if (!result.ok) return { error: 'taken', username };
  await createSession(result.userId);
  await clearGuest();
  return goHome();
}

/** Connexion, limitée par compte et par IP (AUTH-7). Même message pour un compte inconnu et un mauvais mot de passe. */
export async function loginAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const username = text(form, 'username').trim();
  const password = text(form, 'password');
  const keys = await attemptKeys(username);
  if (await anyBlocked(keys)) return { error: 'blocked', username };

  const user = await findUserByUsername(username);
  const ok = user ? await verifyPassword(user.passwordHash, password) : await dummyVerify(password);
  if (!user || !ok) {
    await recordFailure(keys);
    return { error: 'invalid', username };
  }
  await clearFailures(keys);
  await createSession(user.id);
  await attachGuestGames(user.id, await getGuest());
  await clearGuest();
  return goHome();
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  return goHome();
}

/** Premier accès par OAuth : l'utilisateur choisit son pseudo et son mot de passe (AUTH-4). */
export async function completeOAuthAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const username = text(form, 'username').trim();
  const password = text(form, 'password');
  const invalid = checkCredentials(username, password);
  if (invalid) return invalid;

  const jar = await cookies();
  const token = jar.get(OAUTH_PENDING_COOKIE)?.value;
  const tokenHash = token ? createHash('sha256').update(token).digest('hex') : null;
  const [pending] = tokenHash
    ? await db.select().from(oauthPending).where(and(eq(oauthPending.tokenHash, tokenHash), gt(oauthPending.expiresAt, new Date()))).limit(1)
    : [];
  if (!pending) return { error: 'expired', username };

  const guest = await getGuest();
  const result = await createAccount({
    username,
    password,
    guest,
    country: await countryFromHeaders(),
    oauth: { provider: pending.provider, providerUserId: pending.providerUserId },
  });
  if (!result.ok) return { error: 'taken', username };
  await db.delete(oauthPending).where(eq(oauthPending.tokenHash, pending.tokenHash));
  jar.delete(OAUTH_PENDING_COOKIE);
  await createSession(result.userId);
  await clearGuest();
  return goHome();
}

/** Un invité choisit son pseudo (3 à 20 caractères) avant de rejoindre un lobby. `null` si valide, sinon le code d'erreur. */
export async function setGuestNameAction(name: string): Promise<'length' | 'characters' | 'account' | null> {
  if (await getSessionUser()) return 'account';
  const trimmed = typeof name === 'string' ? name.trim() : '';
  const error = validateUsername(trimmed);
  if (error) return error;
  const guest = await getGuest();
  await setGuest({ name: trimmed, country: guest?.country ?? (await countryFromHeaders()), games: guest?.games ?? [] });
  return null;
}

// `values` : ce que le formulaire a envoyé, pour le réafficher (React vide les champs après une action).
export type ProfileState = { values?: Record<string, string>; ok?: boolean; error?: 'displayName' | 'github' | 'discord' | 'avatarType' | 'avatarSize' | 'avatarInvalid' | 'auth' } | null;

/** Nom affiché, distinct de l'identifiant de connexion (PROF-3). */
export async function updateDisplayNameAction(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) return { error: 'auth' };
  const displayName = text(form, 'displayName').trim();
  if (validateDisplayName(displayName)) return { error: 'displayName', values: { displayName } };
  await db.update(users).set({ displayName }).where(eq(users.id, user.id));
  return { ok: true, values: { displayName } };
}

/** Liens GitHub et Discord affichés sur le profil (PROF-4) ; vides, ils disparaissent. */
export async function updateLinksAction(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) return { error: 'auth' };
  const input = { github: text(form, 'github'), discord: text(form, 'discord') };
  const errors = validateLinks(input);
  const values = { github: input.github, discord: input.discord };
  if (errors.github) return { error: 'github', values };
  if (errors.discord) return { error: 'discord', values };
  await db.update(users).set({ github: normalizeGithub(input.github), discord: input.discord.trim() }).where(eq(users.id, user.id));
  return { ok: true, values };
}

/** Téléverse une photo de profil (PROF-5) : JPEG, PNG ou WebP de 2 Mo au plus, recadrée et redimensionnée avant stockage. */
export async function uploadAvatarAction(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) return { error: 'auth' };
  const file = form.get('avatar');
  if (!(file instanceof File)) return { error: 'avatarSize' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = validateAvatarFile(bytes);
  if (problem) return { error: problem === 'size' ? 'avatarSize' : 'avatarType' };

  let avatar: Buffer;
  try {
    avatar = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { error: 'avatarInvalid' };
  }
  await db.update(users).set({ avatar, avatarVersion: user.avatarVersion + 1 }).where(eq(users.id, user.id));
  return { ok: true };
}

export async function removeAvatarAction(): Promise<void> {
  const user = await getSessionUser();
  if (user) await db.update(users).set({ avatar: null, avatarVersion: user.avatarVersion + 1 }).where(eq(users.id, user.id));
}
