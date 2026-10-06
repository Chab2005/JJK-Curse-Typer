import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import WaitingRoom from '@/components/lobby/WaitingRoom';
import type { Locale } from '@/i18n/config';
import { getViewerId } from '@/lib/currentUser';
import { storedLobby } from '@/lib/lobbies';
import { openLobby } from '@/lib/openLobby';

export async function generateMetadata({ params, searchParams }: PageProps<'/[locale]/lobby/[code]'>) {
  const { locale, code } = await params;
  const room = await openLobby(decodeURIComponent(code), { invite: (await searchParams).invite });
  if (!room) return { title: (await getTranslations({ locale: locale as Locale, namespace: 'NotFound' }))('lobby.metaTitle') };
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Lobby' });
  return { title: t('metaTitle', { name: room.name }) };
}

// Salon d'attente d'un lobby (LOB-5 à LOB-9, LOB-11) ; ?spectate=1 pour y entrer en spectateur,
// ?invite=<jeton> pour entrer dans un lobby privé (LOB-4). Un lobby fermé au visiteur répond comme un code inconnu.
// La page ne fait qu'afficher : le salon d'attente entre dans le lobby une fois chargé dans le navigateur.
export default async function LobbyPage({ params, searchParams }: PageProps<'/[locale]/lobby/[code]'>) {
  const { locale, code } = await params;
  setRequestLocale(locale as Locale);
  const { spectate, invite } = await searchParams;
  const room = await openLobby(decodeURIComponent(code), { spectate: spectate === '1', invite });
  if (!room) notFound();
  const viewerId = await getViewerId();
  const live = storedLobby(room.code) !== null;

  return (
    <>
      <SiteHeader />
      <main className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        {/* La clé repart d'un salon neuf pour un autre visiteur (pseudo d'invité choisi) ou en passant par ?spectate=1. */}
        <WaitingRoom
          key={`${room.code}-${viewerId}-${spectate === '1'}`}
          initialRoom={room}
          viewerId={viewerId}
          live={live}
          invite={typeof invite === 'string' ? invite : undefined}
          spectate={spectate === '1'}
        />
      </main>
      <Footer />
    </>
  );
}
