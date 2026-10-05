import 'server-only';
import { Discord, GitHub } from 'arctic';

// OAuth Discord et GitHub (AUTH-4). On ne demande que l'identité publique : aucune portée « email » (AUTH-3).

export const PROVIDERS = ['discord', 'github'] as const;
export type Provider = (typeof PROVIDERS)[number];

export const isProvider = (value: unknown): value is Provider => PROVIDERS.includes(value as Provider);

const appUrl = () => (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const redirectUri = (provider: Provider) => `${appUrl()}/api/auth/${provider}/callback`;

/** `null` si le fournisseur n'est pas configuré (variables d'environnement absentes). */
export function oauthClient(provider: Provider): Discord | GitHub | null {
  if (provider === 'discord') {
    const { DISCORD_CLIENT_ID: id, DISCORD_CLIENT_SECRET: secret } = process.env;
    return id && secret ? new Discord(id, secret, redirectUri('discord')) : null;
  }
  const { GITHUB_CLIENT_ID: id, GITHUB_CLIENT_SECRET: secret } = process.env;
  return id && secret ? new GitHub(id, secret, redirectUri('github')) : null;
}

/** Identifiant stable du compte chez le fournisseur. Le reste du profil (courriel compris) est ignoré. */
export async function fetchProviderUserId(provider: Provider, accessToken: string): Promise<string | null> {
  const url = provider === 'discord' ? 'https://discord.com/api/users/@me' : 'https://api.github.com/user';
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'jjktyper' } });
  if (!res.ok) return null;
  const { id } = (await res.json()) as { id?: string | number };
  return id === undefined ? null : String(id);
}

export const redirectBase = appUrl;
