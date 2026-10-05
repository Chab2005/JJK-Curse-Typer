import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import WaitingRoom from '@/components/lobby/WaitingRoom';
import type { Locale } from '@/i18n/config';
import { getViewerId } from '@/lib/currentUser';
import { openLobby } from '@/lib/openLobby';

export async function generateMetadata({ params, searchParams }: PageProps<'/[locale]/lobby/[code]'>) {
  const { locale, code } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Lobby' });
  const room = await openLobby(decodeURIComponent(code), { invite: (await searchParams).invite });
  return { title: room ? t('metaTitle', { name: room.name }) : t('notFound.metaTitle') };
}

// Salon d'attente d'un lobby (LOB-5 à LOB-9, LOB-11) ; ?spectate=1 pour le regarder en spectateur,
// ?invite=<jeton> pour entrer dans un lobby privé (LOB-4). Un lobby fermé au visiteur répond comme un code inconnu.
export default async function LobbyPage({ params, searchParams }: PageProps<'/[locale]/lobby/[code]'>) {
  const { locale, code } = await params;
  setRequestLocale(locale as Locale);
  const { spectate, invite } = await searchParams;
  const room = await openLobby(decodeURIComponent(code), { spectate: spectate === '1', invite });
  if (!room) notFound();
  const viewerId = await getViewerId();

  return (
    <>
      <SiteHeader />
      <main className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        {/* La clé repart d'un salon neuf quand on passe de participant à spectateur. */}
        <WaitingRoom key={`${room.code}-${spectate === '1'}`} initialRoom={room} viewerId={viewerId} />
      </main>
      <Footer />
    </>
  );
}
