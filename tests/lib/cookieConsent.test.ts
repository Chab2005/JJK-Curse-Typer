import { describe, expect, it } from 'vitest';
import { CONSENT_COOKIE, canRememberLocale, clearCookie, consentCookie, parseConsent, readConsent } from '@/lib/cookieConsent';

describe('parseConsent', () => {
  it('reconnaît les deux choix', () => {
    expect(parseConsent('accepted')).toBe('accepted');
    expect(parseConsent('declined')).toBe('declined');
  });

  it('ignore une valeur absente ou inconnue', () => {
    expect(parseConsent(undefined)).toBeNull();
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent('')).toBeNull();
    expect(parseConsent('yes')).toBeNull();
  });
});

describe('readConsent', () => {
  it('lit le choix dans document.cookie, parmi les autres cookies', () => {
    expect(readConsent(`NEXT_LOCALE=fr; ${CONSENT_COOKIE}=declined; other=1`)).toBe('declined');
    expect(readConsent(`${CONSENT_COOKIE}=accepted`)).toBe('accepted');
  });

  it("retourne null tant qu'aucun choix n'est fait", () => {
    expect(readConsent('')).toBeNull();
    expect(readConsent('NEXT_LOCALE=fr')).toBeNull();
    expect(readConsent(`x${CONSENT_COOKIE}=accepted`)).toBeNull();
    expect(readConsent(`${CONSENT_COOKIE}=maybe`)).toBeNull();
  });
});

describe('canRememberLocale', () => {
  it("ne garde la langue qu'après un accord", () => {
    expect(canRememberLocale('accepted')).toBe(true);
    expect(canRememberLocale('declined')).toBe(false);
    expect(canRememberLocale(null)).toBe(false);
  });
});

describe('consentCookie', () => {
  it('pose le choix pour tout le site, pour un an', () => {
    expect(consentCookie('accepted', false)).toBe(`${CONSENT_COOKIE}=accepted; Path=/; Max-Age=31536000; SameSite=Lax`);
  });

  it('ajoute Secure en HTTPS', () => {
    expect(consentCookie('declined', true)).toBe(`${CONSENT_COOKIE}=declined; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
  });
});

describe('clearCookie', () => {
  it('efface un cookie du site', () => {
    expect(clearCookie('NEXT_LOCALE')).toBe('NEXT_LOCALE=; Path=/; Max-Age=0; SameSite=Lax');
  });
});
