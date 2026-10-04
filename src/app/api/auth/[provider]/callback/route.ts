import { createHash, randomBytes } from 'node:crypto';
import { lt } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/db';
import { oauthPending } from '@/db/schema';
import { findUserByOauth } from '@/lib/auth/accounts';
import { OAUTH_PENDING_COOKIE, OAUTH_STATE_COOKIE, secureCookies } from '@/lib/auth/config';
import { fetchProviderUserId, isProvider, oauthClient, redirectBase } from '@/lib/auth/oauth';
import { createSession } from '@/lib/auth/session';

const PENDING_MINUTES = 15;

// Retour du fournisseur : un compte déjà lié ouvre une session ; sinon l'identité attend que l'utilisateur
// choisisse son pseudo et son mot de passe (AUTH-4). Rien d'autre que l'identifiant n'est retenu (AUTH-3).
export async function GET(request: NextRequest, { params }: RouteContext<'/api/auth/[provider]/callback'>) {
  const { provider } = await params;
  const base = redirectBase();
  const fail = (error: string) => NextResponse.redirect(`${base}/login?error=${error}`);
  if (!isProvider(provider)) return new NextResponse('Not found', { status: 404 });

  const client = oauthClient(provider);
  const [state, verifier] = (request.cookies.get(OAUTH_STATE_COOKIE)?.value ?? '').split('.');
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  if (!client || !state || !code || searchParams.get('state') !== state) return fail('oauthFailed');

  let providerUserId: string | null;
  try {
    const tokens =
      provider === 'discord'
        ? await (client as import('arctic').Discord).validateAuthorizationCode(code, verifier)
        : await (client as import('arctic').GitHub).validateAuthorizationCode(code);
    providerUserId = await fetchProviderUserId(provider, tokens.accessToken());
  } catch {
    return fail('oauthFailed');
  }
  if (!providerUserId) return fail('oauthFailed');

  let response: NextResponse;
  const existing = await findUserByOauth(provider, providerUserId);
  if (existing) {
    await createSession(existing.id);
    response = NextResponse.redirect(`${base}/`);
  } else {
    const token = randomBytes(32).toString('base64url');
    await db.delete(oauthPending).where(lt(oauthPending.expiresAt, new Date()));
    await db.insert(oauthPending).values({
      tokenHash: createHash('sha256').update(token).digest('hex'),
      provider,
      providerUserId,
      expiresAt: new Date(Date.now() + PENDING_MINUTES * 60_000),
    });
    response = NextResponse.redirect(`${base}/register/oauth`);
    response.cookies.set(OAUTH_PENDING_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: secureCookies(), path: '/', maxAge: PENDING_MINUTES * 60 });
  }
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
