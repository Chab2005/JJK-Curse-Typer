// Décision de redirection de langue, en amont de next-intl (GEN-3).
// Fonction pure : le proxy lui passe la requête et applique le résultat.
//
// - Domaine racine (anglais) : redirige vers le sous-domaine de la langue
//   préférée (cookie de choix explicite, sinon Accept-Language).
// - `?lang=xx` (sélecteur de langue) : le choix est mémorisé dans un cookie
//   du domaine racine, puis le visiteur est envoyé sur le domaine de la langue.
// - Hôte inconnu (preview Vercel, IP) : pas de sous-domaine, la langue passe
//   par le préfixe de chemin (`/fr/...`) géré par next-intl.

import {
  LANG_PARAM,
  defaultLocale,
  hostForLocale,
  isLocale,
  localeForHost,
  locales,
  type Locale,
} from './config';

export type LocaleRequest = {
  host: string;
  /** Chemin tel que vu par le navigateur, sans le préfixe interne de next-intl. */
  pathname: string;
  /** Chaîne de requête avec son `?`, ou chaîne vide. */
  search: string;
  acceptLanguage: string | null;
  cookieLocale: string | undefined;
};

export type LocaleDecision =
  | { type: 'next' }
  | { type: 'redirect'; host: string; pathname: string; search: string; setCookie?: Locale };

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

export function resolveLocaleRedirect(req: LocaleRequest, root: string): LocaleDecision {
  const hostLocale = localeForHost(req.host, root);
  const requested = new URLSearchParams(req.search).get(LANG_PARAM);

  if (isLocale(requested)) {
    const search = withoutLangParam(req.search);

    if (hostLocale === undefined) {
      const pathname = withLocalePrefix(stripLocalePrefix(req.pathname), requested);
      return { type: 'redirect', host: req.host, pathname, search };
    }
    if (hostLocale !== defaultLocale) {
      // Le cookie de choix vit sur le domaine racine : on y passe d'abord.
      return { type: 'redirect', host: root, pathname: req.pathname, search: req.search };
    }
    return {
      type: 'redirect',
      host: hostForLocale(requested, root),
      pathname: req.pathname,
      search,
      setCookie: requested,
    };
  }

  if (hostLocale !== defaultLocale) return { type: 'next' };

  const preferred = isLocale(req.cookieLocale)
    ? req.cookieLocale
    : matchAcceptLanguage(req.acceptLanguage) ?? defaultLocale;

  if (preferred === defaultLocale) return { type: 'next' };
  return { type: 'redirect', host: hostForLocale(preferred, root), pathname: req.pathname, search: req.search };
}

/**
 * Lien du sélecteur de langue. Sur un domaine de langue, il vise directement
 * la racine (où vit le cookie de choix) : une redirection vers la racine depuis
 * fr. ne suffit pas en dev, car Next la rend relative à `localhost`.
 * `host` vaut `null` avant l'hydratation (rendu serveur).
 */
export function localeSwitchHref(
  { host, pathname, locale }: { host: string | null; pathname: string; locale: Locale },
  root: string,
): string {
  const path = `${pathname}?${LANG_PARAM}=${locale}`;
  return host !== null && localeForHost(host, root) !== undefined ? `//${root}${path}` : path;
}
