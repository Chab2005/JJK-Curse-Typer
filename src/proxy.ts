import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE } from './i18n/config';
import { resolveLocaleRedirect } from './i18n/locale-redirect';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const ONE_YEAR = 60 * 60 * 24 * 365;

export default function proxy(request: NextRequest) {
  const decision = resolveLocaleRedirect({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    acceptLanguage: request.headers.get('accept-language'),
    cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
  });

  if (decision.type === 'next') return handleI18nRouting(request);

  // Derrière le proxy de Railway, `nextUrl` vise l'hôte interne : on garde l'hôte vu par le navigateur.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0];
  const protocol = forwardedProto ? `${forwardedProto}:` : request.nextUrl.protocol;
  const response = NextResponse.redirect(
    `${protocol}//${host}${decision.pathname}${decision.search}`,
  );
  if (decision.setCookie) {
    response.cookies.set(LOCALE_COOKIE, decision.setCookie, {
      path: '/',
      maxAge: ONE_YEAR,
      sameSite: 'lax',
    });
  }
  return response;
}

export const config = {
  // Tout sauf les routes d'API, les WebSocket de course, les fichiers internes de Next et les fichiers statiques.
  matcher: '/((?!api|ws/|_next|_vercel|.*\\..*).*)',
};
