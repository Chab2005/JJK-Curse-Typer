// Décision de redirection de langue, en amont de next-intl (GEN-3).
// Fonction pure : le proxy lui passe la requête et applique le résultat.
//
// - `?lang=xx` (sélecteur de langue) : le choix est mémorisé dans un cookie,
//   puis le visiteur est envoyé sur la même page sous le préfixe de la langue.
// - Chemin sans préfixe (anglais) : redirige vers `/fr/...` si la langue
//   préférée est le français (cookie de choix explicite, sinon Accept-Language).
// - Chemin déjà préfixé : servi tel quel par next-intl.

import { LANG_PARAM, defaultLocale, isLocale, locales, type Locale } from './config';

export type LocaleRequest = {
  /** Chemin tel que vu par le navigateur. */
  pathname: string;
  /** Chaîne de requête avec son `?`, ou chaîne vide. */
  search: string;
  acceptLanguage: string | null;
  cookieLocale: string | undefined;
};

export type LocaleDecision =
  | { type: 'next' }
  | { type: 'redirect'; pathname: string; search: string; setCookie?: Locale };

/** Première langue supportée de l'en-tête Accept-Language, par poids q décroissant. */
export function matchAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined;

  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const weight = q ? Number(q.slice(2)) : 1;
      return { language: tag.split('-')[0].toLowerCase(), weight, index };
    })
    .filter(({ weight }) => Number.isFinite(weight) && weight > 0)
    .toSorted((a, b) => b.weight - a.weight || a.index - b.index);

  return ranked.map(({ language }) => language).find(isLocale);
}

function withoutLangParam(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(LANG_PARAM);
  const rest = params.toString();
  return rest ? `?${rest}` : '';
}

function stripLocalePrefix(pathname: string): string {
  const prefix = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  return prefix ? pathname.slice(prefix.length + 1) || '/' : pathname;
}

function withLocalePrefix(pathname: string, locale: Locale): string {
  if (locale === defaultLocale) return pathname;
  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
}

export function resolveLocaleRedirect(req: LocaleRequest): LocaleDecision {
  const requested = new URLSearchParams(req.search).get(LANG_PARAM);

  if (isLocale(requested)) {
    const pathname = withLocalePrefix(stripLocalePrefix(req.pathname), requested);
    return { type: 'redirect', pathname, search: withoutLangParam(req.search), setCookie: requested };
  }

  // Un lien sans préfixe (saisi à la main, retour OAuth) : le cookie de choix,
  // sinon la langue du navigateur (I18N-02), rétablit `/fr/...`.
  const unprefixed = stripLocalePrefix(req.pathname) === req.pathname;
  const preferred = isLocale(req.cookieLocale) ? req.cookieLocale : matchAcceptLanguage(req.acceptLanguage);
  if (unprefixed && preferred !== undefined && preferred !== defaultLocale) {
    return { type: 'redirect', pathname: withLocalePrefix(req.pathname, preferred), search: req.search };
  }
  return { type: 'next' };
}

/** Lien du sélecteur de langue : la page courante (sans préfixe) avec `?lang=xx`. */
export function localeSwitchHref({ pathname, locale }: { pathname: string; locale: Locale }): string {
  return `${pathname}?${LANG_PARAM}=${locale}`;
}
