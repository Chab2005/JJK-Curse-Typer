import { useSyncExternalStore } from 'react';
import { LOCALE_COOKIE } from '@/i18n/config';
import { clearCookie, consentCookie, readConsent, type CookieConsent } from '@/lib/cookieConsent';

// Ouverture de la carte des cookies, partagée entre la carte et le lien « Cookies » du pied de page.
// La carte est ouverte tant que le cookie de choix manque, ou quand le visiteur la rouvre.
let reopened = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const isOpen = () => reopened || readConsent(document.cookie) === null;

/** `false` côté serveur : la carte n'apparaît qu'une fois la page hydratée, d'après les cookies du navigateur. */
export const useConsentOpen = () => useSyncExternalStore(subscribe, isOpen, () => false);

export function chooseConsent(consent: CookieConsent) {
  document.cookie = consentCookie(consent, location.protocol === 'https:');
  if (consent === 'declined') document.cookie = clearCookie(LOCALE_COOKIE);
  reopened = false;
  notify();
}

export function reopenConsent() {
  reopened = true;
  notify();
}
