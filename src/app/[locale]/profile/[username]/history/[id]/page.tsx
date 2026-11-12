import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import PastRaceView from '@/components/history/PastRaceView';
import { archivedView, legacyView } from '@/components/history/pastRace';
import type { Locale } from '@/i18n/config';
import { redirect } from '@/i18n/navigation';
import { findAccountProfile } from '@/lib/auth/profile';
import { getSessionUser } from '@/lib/auth/session';
import { pastRace } from '@/lib/history';
import { historyIdSchema, usernameParamSchema } from '@/lib/schemas';

// Métadonnées et page lisent la même course : une seule lecture par requête. La course doit être une ligne de ce joueur.
const loadRace = cache(async (username: string, id: string) => {
  const name = usernameParamSchema.safeParse(username);
  const resultId = historyIdSchema.safeParse(id);
  const owner = name.success ? await findAccountProfile(name.data) : null;
  if (!owner || !resultId.success) return { owner, resultId: null, race: null };
  return { owner, resultId: resultId.data, race: await pastRace(owner.id, resultId.data) };
});

export async function generateMetadata({ params }: PageProps<'/[locale]/profile/[username]/history/[id]'>) {
  const { locale, username, id } = await params;
  const { race } = await loadRace(username, id);
  if (!race) return { title: (await getTranslations({ locale: locale as Locale, namespace: 'NotFound' }))('otherRace.metaTitle') };
  const format = await getFormatter({ locale: locale as Locale });
  const t = await getTranslations({ locale: locale as Locale, namespace: 'History.race' });
  return { title: t('metaTitle', { date: format.dateTime(new Date(race.at), { dateStyle: 'medium', timeStyle: 'short' }) }) };
}

// Page de résultats d'une course de l'historique d'un autre joueur (HIST-02), ouverte à tout compte connecté. Le visiteur
// est repéré dans le tableau s'il a couru cette course aussi. Sa propre course se lit sur /history/<id>.
export default async function PlayerRacePage({ params }: PageProps<'/[locale]/profile/[username]/history/[id]'>) {
  const { locale, username, id } = await params;
  setRequestLocale(locale as Locale);
  const viewer = await getSessionUser();
  if (!viewer) redirect({ href: '/login', locale: locale as Locale });
  const { owner, resultId, race } = await loadRace(username, id);
  if (!owner || !race) notFound();
  if (owner.id === viewer!.id) redirect({ href: `/history/${resultId}`, locale: locale as Locale });
  const t = await getTranslations('History');
  const tLobby = await getTranslations('Lobby.participants');
  const format = await getFormatter();
  const date = format.dateTime(new Date(race.at), { dateStyle: 'medium', timeStyle: 'short' });
  const name = owner.displayName;
  const view = race.race
    ? archivedView(race.race.participants, viewer!.id, (number) => tLobby('botName', { number }))
    : legacyView(race.own, { username: owner.username, name }, false);

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        <PastRaceView
          eyebrow={t('other.raceEyebrow', { name })}
          title={t('race.title', { date })}
          intro={race.race ? t('race.intro', { players: race.race.players, code: race.race.lobbyCode }) : t('race.legacyIntro')}
          lobbyCode={race.race?.lobbyCode ?? null}
          legacy={!race.race}
          view={view}
          back={{ href: `/profile/${encodeURIComponent(owner.username)}/history`, label: t('other.back', { name }) }}
        />
      </main>
      <Footer />
    </>
  );
}
