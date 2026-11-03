import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE } from './i18n/config';
import { resolveLocaleRedirect } from './i18n/locale-redirect';
import { routing } from './i18n/routing';
import { CONSENT_COOKIE, canRememberLocale, parseConsent } from './lib/cookieConsent';

const handleI18nRouting = createMiddleware(routing);

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Requête partie d'une page du site : en-tête Sec-Fetch-Site, sinon Referer (rechargement, vieux navigateurs). */
function isFromSite(request: NextRequest, host: string): boolean {
  if (request.headers.get('sec-fetch-site') === 'same-origin') return true;
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    return new URL(referer).host === host;
  } catch {
    return false;
  }
}

export default function proxy(request: NextRequest) {
  // Derrière le proxy de Railway, `nextUrl` vise l'hôte interne : on garde l'hôte vu par le navigateur.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
  const decision = resolveLocaleRedirect({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    acceptLanguage: request.headers.get('accept-language'),
    cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
    fromSite: isFromSite(request, host),
  });

  if (decision.type === 'next') return handleI18nRouting(request);

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0];
  const protocol = forwardedProto ? `${forwardedProto}:` : request.nextUrl.protocol;
  const response = NextResponse.redirect(
    `${protocol}//${host}${decision.pathname}${decision.search}`,
  );
  // Le choix de langue n'est mémorisé qu'avec l'accord du visiteur (carte des cookies).
  const consent = parseConsent(request.cookies.get(CONSENT_COOKIE)?.value);
  if (decision.setCookie && canRememberLocale(consent)) {
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
