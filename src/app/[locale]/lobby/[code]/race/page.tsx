import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import RaceFooter from '@/components/race/RaceFooter';
import RaceScreen from '@/components/race/RaceScreen';
import type { Locale } from '@/i18n/config';
import { SAMPLE_CURRENT_USER } from '@/lib/currentUser';
import { findLobby } from '@/lib/lobbies';

export async function generateMetadata({ params }: PageProps<'/[locale]/lobby/[code]/race'>) {
  const { locale, code } = await params;
  const room = findLobby(decodeURIComponent(code), SAMPLE_CURRENT_USER, false);
  if (!room) return { title: (await getTranslations({ locale: locale as Locale, namespace: 'Lobby' }))('notFound.metaTitle') };
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Race' });
  return { title: t('metaTitle', { name: room.name }) };
}

// Course d'un lobby (maquette « Course ») ; l'écran se connecte à la room de course de server.ts.
export default async function RacePage({ params }: PageProps<'/[locale]/lobby/[code]/race'>) {
  const { locale, code } = await params;
  setRequestLocale(locale as Locale);
  const room = findLobby(decodeURIComponent(code), SAMPLE_CURRENT_USER, false);
  if (!room) notFound();

  return (
    <>
      <RaceScreen code={room.code} lobbyName={room.name} />
      <RaceFooter />
    </>
  );
}
