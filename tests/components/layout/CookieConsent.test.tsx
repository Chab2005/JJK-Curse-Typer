import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CookieConsent from '@/components/layout/CookieConsent';
import CookieSettingsButton from '@/components/layout/CookieSettingsButton';
import { CONSENT_COOKIE } from '@/lib/cookieConsent';
import { renderWithIntl } from '../../render';

function clearCookies() {
  for (const name of document.cookie.split(';').map((part) => part.split('=')[0].trim()).filter(Boolean)) {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
}

const card = () => screen.queryByRole('region', { name: 'Cookies' });

describe('CookieConsent', () => {
  afterEach(clearCookies);

  it("s'affiche tant qu'aucun choix n'est fait", () => {
    renderWithIntl(<CookieConsent />);

    expect(card()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
  });

  it('reste caché quand le choix est déjà fait', () => {
    document.cookie = `${CONSENT_COOKIE}=declined; Path=/`;
    renderWithIntl(<CookieConsent />);

    expect(card()).not.toBeInTheDocument();
  });

  it("Accepter mémorise l'accord et ferme la carte", async () => {
    const { user } = renderWithIntl(<CookieConsent />);

    await user.click(screen.getByRole('button', { name: 'Accept' }));

    expect(document.cookie).toContain(`${CONSENT_COOKIE}=accepted`);
    expect(card()).not.toBeInTheDocument();
  });

  it('Refuser mémorise le refus, oublie la langue et ferme la carte', async () => {
    document.cookie = 'NEXT_LOCALE=fr; Path=/';
    const { user } = renderWithIntl(<CookieConsent />);

    await user.click(screen.getByRole('button', { name: 'Decline' }));

    expect(document.cookie).toContain(`${CONSENT_COOKIE}=declined`);
    expect(document.cookie).not.toContain('NEXT_LOCALE');
    expect(card()).not.toBeInTheDocument();
  });

  it('le lien « Cookies » du pied de page rouvre la carte', async () => {
    document.cookie = `${CONSENT_COOKIE}=accepted; Path=/`;
    const { user } = renderWithIntl(
      <>
        <CookieSettingsButton />
        <CookieConsent />
      </>,
    );
    expect(card()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cookies' }));
    expect(card()).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Decline' }));
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=declined`);
    expect(card()).not.toBeInTheDocument();
  });

  it('suit un choix fait dans un autre composant monté', async () => {
    const { user } = renderWithIntl(
      <>
        <CookieConsent />
        <CookieConsent />
      </>,
    );
    expect(screen.getAllByRole('region', { name: 'Cookies' })).toHaveLength(2);

    await act(() => user.click(screen.getAllByRole('button', { name: 'Accept' })[0]));
    expect(card()).not.toBeInTheDocument();
  });
});
