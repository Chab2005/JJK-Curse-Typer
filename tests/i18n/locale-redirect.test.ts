import { describe, expect, it } from 'vitest';
import {
  localeSwitchHref,
  matchAcceptLanguage,
  resolveLocaleRedirect,
  type LocaleRequest,
} from '@/i18n/locale-redirect';

function request(overrides: Partial<LocaleRequest>): LocaleRequest {
  return {
    pathname: '/',
    search: '',
    acceptLanguage: null,
    cookieLocale: undefined,
    ...overrides,
  };
}

describe('matchAcceptLanguage', () => {
  it('retourne la première langue supportée selon les poids q', () => {
    expect(matchAcceptLanguage('fr-CA,fr;q=0.9,en;q=0.8')).toBe('fr');
    expect(matchAcceptLanguage('en-US,en;q=0.9,fr;q=0.8')).toBe('en');
    expect(matchAcceptLanguage('en;q=0.5,fr;q=0.9')).toBe('fr');
  });

  it('ignore les langues non supportées', () => {
    expect(matchAcceptLanguage('de-DE,fr;q=0.7')).toBe('fr');
    expect(matchAcceptLanguage('de-DE,es;q=0.7')).toBeUndefined();
  });

  it('ignore les langues refusées (q=0) et les en-têtes vides', () => {
    expect(matchAcceptLanguage('fr;q=0,en;q=0.1')).toBe('en');
    expect(matchAcceptLanguage('')).toBeUndefined();
    expect(matchAcceptLanguage(null)).toBeUndefined();
  });
});

describe('resolveLocaleRedirect — détection sur un chemin sans préfixe', () => {
  it('préfixe /fr pour un navigateur francophone en gardant le chemin (I18N-02)', () => {
    expect(
      resolveLocaleRedirect(request({ pathname: '/lobby/ABC', search: '?x=1', acceptLanguage: 'fr-CA,fr;q=0.9' })),
    ).toEqual({ type: 'redirect', pathname: '/fr/lobby/ABC', search: '?x=1' });
    expect(resolveLocaleRedirect(request({ acceptLanguage: 'fr' }))).toEqual({
      type: 'redirect',
      pathname: '/fr',
      search: '',
    });
  });

  it('laisse passer un navigateur anglophone ou sans préférence', () => {
    expect(resolveLocaleRedirect(request({ acceptLanguage: 'en-US' }))).toEqual({ type: 'next' });
    expect(resolveLocaleRedirect(request({ acceptLanguage: 'de-DE' }))).toEqual({ type: 'next' });
    expect(resolveLocaleRedirect(request({}))).toEqual({ type: 'next' });
  });

  it('le cookie (choix explicite) passe avant Accept-Language', () => {
    expect(resolveLocaleRedirect(request({ acceptLanguage: 'fr', cookieLocale: 'en' }))).toEqual({ type: 'next' });
    expect(resolveLocaleRedirect(request({ pathname: '/lobbies', search: '?q=1', cookieLocale: 'fr' }))).toEqual({
      type: 'redirect',
      pathname: '/fr/lobbies',
      search: '?q=1',
    });
  });

  it('ignore un cookie invalide', () => {
    expect(resolveLocaleRedirect(request({ acceptLanguage: 'fr', cookieLocale: 'xx' }))).toEqual({
      type: 'redirect',
      pathname: '/fr',
      search: '',
    });
  });

  it('ne redirige jamais un chemin déjà préfixé', () => {
    expect(resolveLocaleRedirect(request({ pathname: '/fr', acceptLanguage: 'en', cookieLocale: 'en' }))).toEqual({
      type: 'next',
    });
    expect(resolveLocaleRedirect(request({ pathname: '/fr/lobbies', cookieLocale: 'fr' }))).toEqual({ type: 'next' });
  });

  it('ne confond pas un chemin qui commence par les lettres de la langue', () => {
    expect(resolveLocaleRedirect(request({ pathname: '/friends', cookieLocale: 'fr' }))).toEqual({
      type: 'redirect',
      pathname: '/fr/friends',
      search: '',
    });
  });
});

describe('resolveLocaleRedirect — sélecteur de langue (?lang=)', () => {
  it('mémorise le choix et passe sous le préfixe de la langue', () => {
    expect(resolveLocaleRedirect(request({ pathname: '/stats', search: '?lang=fr&tab=1' }))).toEqual({
      type: 'redirect',
      pathname: '/fr/stats',
      search: '?tab=1',
      setCookie: 'fr',
    });
  });

  it('choisir l’anglais retire le préfixe et pose le cookie', () => {
    expect(resolveLocaleRedirect(request({ pathname: '/fr/stats', search: '?lang=en' }))).toEqual({
      type: 'redirect',
      pathname: '/stats',
      search: '',
      setCookie: 'en',
    });
    expect(resolveLocaleRedirect(request({ pathname: '/fr', search: '?lang=en', acceptLanguage: 'fr' }))).toEqual({
      type: 'redirect',
      pathname: '/',
      search: '',
      setCookie: 'en',
    });
  });

  it('ignore une valeur de ?lang inconnue', () => {
    expect(resolveLocaleRedirect(request({ search: '?lang=de', acceptLanguage: 'en' }))).toEqual({ type: 'next' });
  });
});

describe('localeSwitchHref', () => {
  it('vise la page courante avec ?lang, en lien relatif', () => {
    expect(localeSwitchHref({ pathname: '/stats', locale: 'fr' })).toBe('/stats?lang=fr');
    expect(localeSwitchHref({ pathname: '/', locale: 'en' })).toBe('/?lang=en');
  });
});
