import 'server-only';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db } from '@/db';
import { loginAttempts } from '@/db/schema';
import { clientIp } from '@/components/lobby/lobbyAccess';
import { isBlocked, registerFailure, type AttemptState } from './rateLimit';

// Tentatives de connexion limitées par compte et par IP (AUTH-7), comptées en base.

export async function attemptKeys(username: string): Promise<string[]> {
  const ip = clientIp(await headers());
  return [`user:${username.trim().toLowerCase()}`, ...(ip ? [`ip:${ip}`] : [])];
}

async function read(key: string): Promise<AttemptState | null> {
  const [row] = await db.select().from(loginAttempts).where(eq(loginAttempts.key, key)).limit(1);
  return row ? { count: row.count, windowStart: row.windowStart.getTime() } : null;
}

export async function anyBlocked(keys: string[]): Promise<boolean> {
  const now = Date.now();
  return (await Promise.all(keys.map(read))).some((state) => isBlocked(state, now));
}

export async function recordFailure(keys: string[]): Promise<void> {
  const now = Date.now();
  await Promise.all(
    keys.map(async (key) => {
      const next = registerFailure(await read(key), now);
      const row = { key, count: next.count, windowStart: new Date(next.windowStart) };
      await db.insert(loginAttempts).values(row).onConflictDoUpdate({ target: loginAttempts.key, set: row });
    }),
  );
}

export async function clearFailures(keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => db.delete(loginAttempts).where(eq(loginAttempts.key, key))));
}
