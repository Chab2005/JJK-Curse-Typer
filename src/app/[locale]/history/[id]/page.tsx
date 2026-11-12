import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import { archivedView, legacyView } from '@/components/history/pastRace';
import RaceSummary from '@/components/race/RaceSummary';
import ChevronButton from '@/components/shared/ChevronButton';
import PageIntro from '@/components/shared/PageIntro';
import type { Locale } from '@/i18n/config';
import { Link, redirect } from '@/i18n/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { pastRace } from '@/lib/history';
import { historyIdSchema } from '@/lib/schemas';

// Métadonnées et page lisent la même course : une seule lecture par requête.
const loadRace = cache(async (id: string) => {
  const user = await getSessionUser();
  const resultId = historyIdSchema.safeParse(id);
  if (!user || !resultId.success) return { user, race: null };
  return { user, race: await pastRace(user.id, resultId.data) };
});

export async function generateMetadata({ params }: PageProps<'/[locale]/history/[id]'>) {
  const { locale, id } = await params;
  const { race } = await loadRace(id);
  if (!race) return { title: (await getTranslations({ locale: locale as Locale, namespace: 'NotFound' }))('race.metaTitle') };
  const format = await getFormatter({ locale: locale as Locale });
  const t = await getTranslations({ locale: locale as Locale, namespace: 'History.race' });
  return { title: t('metaTitle', { date: format.dateTime(new Date(race.at), { dateStyle: 'medium', timeStyle: 'short' }) }) };
}

// Page de résultats d'une course passée (HIST-02), reconstruite depuis la base avec les composants de l'écran de course :
// podium, tableau complet, courbe du MPM de tous et touches ratées. Seul un participant l'ouvre (sa ligne `results`) :
// les autres reçoivent une 404. Une course d'avant l'archivage ne montre que la ligne du joueur, avec une note.
export default async function PastRacePage({ params }: PageProps<'/[locale]/history/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const { user, race } = await loadRace(id);
  if (!user) redirect({ href: '/login', locale: locale as Locale });
  if (!race) notFound();
  const t = await getTranslations('History.race');
  const tLobby = await getTranslations('Lobby.participants');
  const format = await getFormatter();
  const date = format.dateTime(new Date(race.at), { dateStyle: 'medium', timeStyle: 'short' });
  const view = race.race
    ? archivedView(race.race.participants, user!.id, (number) => tLobby('botName', { number }))
    : legacyView(race.own, { username: user!.username, name: user!.displayName });

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        <div className="relative mx-auto flex max-w-[1100px] flex-col gap-8 px-6 pt-14 pb-24">
          <PageIntro
            id="past-race-title"
            eyebrow={t('eyebrow')}
            title={t('title', { date })}
            intro={race.race ? t('intro', { players: race.race.players, code: race.race.lobbyCode }) : t('legacyIntro')}
            watermark={race.race?.lobbyCode ?? '—'}
            chevrons
          />
          {!race.race && (
            <p role="note" className="border-l-[3px] border-secondary bg-secondary-container/20 px-5 py-4 text-on-surface-variant">
              {t('legacyNote')}
            </p>
          )}
          <RaceSummary
            rows={view.rows}
            you={view.you}
            over
            series={view.series}
            lobbyCode={race.race?.lobbyCode ?? ''}
            actions={
              <ChevronButton as={Link} href="/history" variant="primary" frame="self-start" className="text-[15px] uppercase tracking-[0.12em]">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
                {t('back')}
              </ChevronButton>
            }
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
