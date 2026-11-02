// Consentement aux cookies : les cookies essentiels (session, invité, OAuth) restent toujours actifs ;
// seul le cookie de langue (NEXT_LOCALE) attend un accord. Module pur, importé par le proxy et par la carte.

export const CONSENT_COOKIE = 'cookie_consent';

export type CookieConsent = 'accepted' | 'declined';

const ONE_YEAR = 60 * 60 * 24 * 365;

export function parseConsent(value: string | null | undefined): CookieConsent | null {
  return value === 'accepted' || value === 'declined' ? value : null;
}

/** Choix lu dans `document.cookie` ; `null` tant que le visiteur n'a pas répondu. */
export function readConsent(cookieHeader: string): CookieConsent | null {
  const entry = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(entry?.slice(CONSENT_COOKIE.length + 1));
}

/** La langue choisie n'est mémorisée qu'avec l'accord du visiteur. */
export function canRememberLocale(consent: CookieConsent | null): boolean {
  return consent === 'accepted';
}

/** Valeur à écrire dans `document.cookie` pour mémoriser le choix. */
export function consentCookie(consent: CookieConsent, secure: boolean): string {
  return `${CONSENT_COOKIE}=${consent}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/** Valeur à écrire dans `document.cookie` pour effacer un cookie du site. */
export function clearCookie(name: string): string {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}
