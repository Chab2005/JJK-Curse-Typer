import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import RaceFooter from '@/components/race/RaceFooter';
import RaceScreen from '@/components/race/RaceScreen';
import type { Locale } from '@/i18n/config';
import { authSecret } from '@/lib/auth/config';
import { getSessionUser } from '@/lib/auth/session';
import { getViewerId } from '@/lib/currentUser';
import { storedLobby } from '@/lib/lobbies';
import { openLobby } from '@/lib/openLobby';
import { seatTicket } from '@/realtime/ticket';

export async function generateMetadata({ params, searchParams }: PageProps<'/[locale]/lobby/[code]/race'>) {
  const { locale, code } = await params;
  const room = await openLobby(decodeURIComponent(code), { invite: (await searchParams).invite });
  if (!room) return { title: (await getTranslations({ locale: locale as Locale, namespace: 'NotFound' }))('lobby.metaTitle') };
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Race' });
  return { title: t('metaTitle', { name: room.name }) };
}

// Course d'un lobby (maquette « Course ») ; l'écran se connecte à la room de course de server.ts.
// Même accès que le salon d'attente : un lobby privé demande ?invite=<jeton> (LOB-4).
// Dans un lobby créé, seul un joueur du salon reçoit un ticket de siège ; les autres regardent.
export default async function RacePage({ params, searchParams }: PageProps<'/[locale]/lobby/[code]/race'>) {
  const { locale, code } = await params;
  setRequestLocale(locale as Locale);
  const room = await openLobby(decodeURIComponent(code), { invite: (await searchParams).invite });
  if (!room) notFound();
  const user = await getSessionUser();
  const stored = storedLobby(room.code);
  const viewerId = await getViewerId();
  const seated = stored?.participants.some((p) => p.kind === 'human' && p.id === viewerId) ?? false;

  return (
    <>
      <RaceScreen
        code={room.code}
        lobbyName={room.name}
        live={stored !== null}
        ticket={seated ? seatTicket(room.code, viewerId, authSecret()) : undefined}
        account={user && { username: user.username, displayName: user.displayName, avatarUrl: user.hasAvatar ? `/api/avatar/${encodeURIComponent(user.username)}?v=${user.avatarVersion}` : null }}
      />
      <RaceFooter />
    </>
  );
}
