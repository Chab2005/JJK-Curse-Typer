import { describe, expect, it } from 'vitest';
import { hostForLocale, localeForHost } from '@/i18n/config';
import {
  localeSwitchHref,
  matchAcceptLanguage,
  resolveLocaleRedirect,
  type LocaleRequest,
} from '@/i18n/locale-redirect';

const ROOT = 'monkey-type.foo';
const FR = 'fr.monkey-type.foo';

function request(overrides: Partial<LocaleRequest>): LocaleRequest {
  return {
    host: ROOT,
    pathname: '/',
    search: '',
    acceptLanguage: null,
    cookieLocale: undefined,
    ...overrides,
  };
}

describe('hostForLocale / localeForHost', () => {
  it('sert l’anglais sur la racine et le français sur le sous-domaine fr', () => {
    expect(hostForLocale('en', ROOT)).toBe(ROOT);
    expect(hostForLocale('fr', ROOT)).toBe(FR);
    expect(localeForHost(ROOT, ROOT)).toBe('en');
    expect(localeForHost(FR, ROOT)).toBe('fr');
  });

  it('garde le port en dev', () => {
    expect(hostForLocale('fr', 'localhost:3000')).toBe('fr.localhost:3000');
    expect(localeForHost('fr.localhost:3000', 'localhost:3000')).toBe('fr');
  });

  it('ne reconnaît pas les autres hôtes', () => {
    expect(localeForHost('jjktyper.vercel.app', ROOT)).toBeUndefined();
    expect(localeForHost('de.monkey-type.foo', ROOT)).toBeUndefined();
  });
});

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

describe('resolveLocaleRedirect — détection sur le domaine racine', () => {
  it('redirige un navigateur francophone vers fr. en gardant le chemin', () => {
    const result = resolveLocaleRedirect(
      request({ pathname: '/lobby/ABC', search: '?x=1', acceptLanguage: 'fr-CA,fr;q=0.9' }),
      ROOT,
    );
    expect(result).toEqual({ type: 'redirect', host: FR, pathname: '/lobby/ABC', search: '?x=1' });
  });

  it('laisse passer un navigateur anglophone ou sans préférence', () => {
    expect(resolveLocaleRedirect(request({ acceptLanguage: 'en-US' }), ROOT)).toEqual({ type: 'next' });
    expect(resolveLocaleRedirect(request({ acceptLanguage: 'de-DE' }), ROOT)).toEqual({ type: 'next' });
    expect(resolveLocaleRedirect(request({}), ROOT)).toEqual({ type: 'next' });
  });

  it('le cookie (choix explicite) passe avant Accept-Language', () => {
    expect(
      resolveLocaleRedirect(request({ acceptLanguage: 'fr', cookieLocale: 'en' }), ROOT),
    ).toEqual({ type: 'next' });
    expect(
      resolveLocaleRedirect(request({ acceptLanguage: 'en', cookieLocale: 'fr' }), ROOT),
    ).toEqual({ type: 'redirect', host: FR, pathname: '/', search: '' });
  });

  it('ignore un cookie invalide', () => {
    expect(
      resolveLocaleRedirect(request({ acceptLanguage: 'fr', cookieLocale: 'xx' }), ROOT),
    ).toEqual({ type: 'redirect', host: FR, pathname: '/', search: '' });
  });

  it('ne redirige jamais depuis le sous-domaine fr', () => {
    expect(
      resolveLocaleRedirect(request({ host: FR, acceptLanguage: 'en-US', cookieLocale: 'en' }), ROOT),
    ).toEqual({ type: 'next' });
  });

  it('sur un hôte inconnu sans cookie : préfixe la langue du navigateur (I18N-02)', () => {
    const host = 'jjkcursetyper-production.up.railway.app';
    expect(
      resolveLocaleRedirect(request({ host, pathname: '/lobbies', search: '?q=1', acceptLanguage: 'fr-CA,fr;q=0.9' }), ROOT),
    ).toEqual({ type: 'redirect', host, pathname: '/fr/lobbies', search: '?q=1' });
    expect(resolveLocaleRedirect(request({ host, acceptLanguage: 'en-US' }), ROOT)).toEqual({ type: 'next' });
    expect(resolveLocaleRedirect(request({ host, acceptLanguage: 'de-DE' }), ROOT)).toEqual({ type: 'next' });
    expect(resolveLocaleRedirect(request({ host, pathname: '/fr', acceptLanguage: 'en' }), ROOT)).toEqual({ type: 'next' });
  });

  it('sur un hôte inconnu : le choix explicite en cookie passe avant le navigateur', () => {
    const host = 'jjkcursetyper-production.up.railway.app';
    expect(resolveLocaleRedirect(request({ host, acceptLanguage: 'fr', cookieLocale: 'en' }), ROOT)).toEqual({ type: 'next' });
  });
});

describe('resolveLocaleRedirect — sélecteur de langue (?lang=)', () => {
  it('sur la racine : mémorise le choix et redirige vers le domaine de la langue', () => {
    expect(
      resolveLocaleRedirect(request({ pathname: '/stats', search: '?lang=fr&tab=1' }), ROOT),
    ).toEqual({ type: 'redirect', host: FR, pathname: '/stats', search: '?tab=1', setCookie: 'fr' });
  });

  it('sur la racine, choisir l’anglais retire le paramètre et pose le cookie', () => {
    expect(
      resolveLocaleRedirect(request({ search: '?lang=en', acceptLanguage: 'fr' }), ROOT),
    ).toEqual({ type: 'redirect', host: ROOT, pathname: '/', search: '', setCookie: 'en' });
  });

  it('sur fr. : renvoie vers la racine avec ?lang pour que le cookie y soit posé', () => {
    expect(
      resolveLocaleRedirect(request({ host: FR, pathname: '/stats', search: '?lang=en' }), ROOT),
    ).toEqual({ type: 'redirect', host: ROOT, pathname: '/stats', search: '?lang=en' });
  });

  it('sur un hôte inconnu : bascule par préfixe de chemin', () => {
    const host = 'jjktyper.vercel.app';
    expect(
      resolveLocaleRedirect(request({ host, pathname: '/stats', search: '?lang=fr' }), ROOT),
    ).toEqual({ type: 'redirect', host, pathname: '/fr/stats', search: '', setCookie: 'fr' });
    expect(
      resolveLocaleRedirect(request({ host, pathname: '/fr/stats', search: '?lang=en' }), ROOT),
    ).toEqual({ type: 'redirect', host, pathname: '/stats', search: '', setCookie: 'en' });
    expect(
      resolveLocaleRedirect(request({ host, pathname: '/fr', search: '?lang=en' }), ROOT),
    ).toEqual({ type: 'redirect', host, pathname: '/', search: '', setCookie: 'en' });
  });

  it('sur un hôte inconnu : le cookie remet le préfixe sur les liens sans langue', () => {
    const host = 'jjktyper.vercel.app';
    expect(
      resolveLocaleRedirect(request({ host, pathname: '/lobbies', search: '?q=1', cookieLocale: 'fr' }), ROOT),
    ).toEqual({ type: 'redirect', host, pathname: '/fr/lobbies', search: '?q=1' });
    expect(resolveLocaleRedirect(request({ host, pathname: '/', cookieLocale: 'fr' }), ROOT)).toEqual({
      type: 'redirect',
      host,
      pathname: '/fr',
      search: '',
    });
    expect(resolveLocaleRedirect(request({ host, pathname: '/fr/lobbies', cookieLocale: 'fr' }), ROOT)).toEqual({
      type: 'next',
    });
    expect(resolveLocaleRedirect(request({ host, pathname: '/lobbies', cookieLocale: 'en' }), ROOT)).toEqual({
      type: 'next',
    });
  });

  it('ignore une valeur de ?lang inconnue', () => {
    expect(
      resolveLocaleRedirect(request({ search: '?lang=de', acceptLanguage: 'en' }), ROOT),
    ).toEqual({ type: 'next' });
  });
});

describe('localeSwitchHref', () => {
  it('sur un domaine de langue, pointe vers la racine, qui mémorise le choix', () => {
    expect(localeSwitchHref({ host: FR, pathname: '/stats', locale: 'en' }, ROOT)).toBe(
      `//${ROOT}/stats?lang=en`,
    );
    expect(localeSwitchHref({ host: ROOT, pathname: '/', locale: 'fr' }, ROOT)).toBe(`//${ROOT}/?lang=fr`);
  });

  it('sur un hôte inconnu ou avant hydratation, reste relatif', () => {
    expect(localeSwitchHref({ host: 'jjktyper.vercel.app', pathname: '/stats', locale: 'fr' }, ROOT)).toBe(
      '/stats?lang=fr',
    );
    expect(localeSwitchHref({ host: null, pathname: '/', locale: 'fr' }, ROOT)).toBe('/?lang=fr');
  });
});
