import { generateCodeVerifier, generateState } from 'arctic';
import { NextResponse, type NextRequest } from 'next/server';
import { OAUTH_STATE_COOKIE, secureCookies } from '@/lib/auth/config';
import { oauthClient, redirectBase } from '@/lib/auth/oauth';
import { providerSchema } from '@/lib/schemas';

// Début du flux OAuth : on mémorise `state` (et le vérificateur PKCE pour Discord) dans un cookie court, puis on redirige.
export async function GET(_request: NextRequest, { params }: RouteContext<'/api/auth/[provider]'>) {
  const parsed = providerSchema.safeParse((await params).provider);
  if (!parsed.success) return new NextResponse('Not found', { status: 404 });
  const provider = parsed.data;
  const client = oauthClient(provider);
  if (!client) return NextResponse.redirect(`${redirectBase()}/login?error=oauthUnavailable`);

  const state = generateState();
  const verifier = generateCodeVerifier();
  const url =
    provider === 'discord'
      ? (client as import('arctic').Discord).createAuthorizationURL(state, verifier, ['identify'])
      : (client as import('arctic').GitHub).createAuthorizationURL(state, []);

  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE, `${state}.${verifier}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge: 600,
  });
  return response;
}
