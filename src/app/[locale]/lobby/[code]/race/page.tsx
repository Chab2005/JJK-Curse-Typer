import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import RaceFooter from '@/components/race/RaceFooter';
import RaceScreen from '@/components/race/RaceScreen';
import type { Locale } from '@/i18n/config';
import { openLobby } from '@/lib/openLobby';

export async function generateMetadata({ params, searchParams }: PageProps<'/[locale]/lobby/[code]/race'>) {
  const { locale, code } = await params;
  const room = await openLobby(decodeURIComponent(code), { invite: (await searchParams).invite });
  if (!room) return { title: (await getTranslations({ locale: locale as Locale, namespace: 'Lobby' }))('notFound.metaTitle') };
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Race' });
  return { title: t('metaTitle', { name: room.name }) };
}

// Course d'un lobby (maquette « Course ») ; l'écran se connecte à la room de course de server.ts.
// Même accès que le salon d'attente : un lobby privé demande ?invite=<jeton> (LOB-4).
export default async function RacePage({ params, searchParams }: PageProps<'/[locale]/lobby/[code]/race'>) {
  const { locale, code } = await params;
  setRequestLocale(locale as Locale);
  const room = await openLobby(decodeURIComponent(code), { invite: (await searchParams).invite });
  if (!room) notFound();

  return (
    <>
      <RaceScreen code={room.code} lobbyName={room.name} />
      <RaceFooter />
    </>
  );
}
