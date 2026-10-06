import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import LeaderboardBrowser from '@/components/leaderboard/LeaderboardBrowser';
import { showSampleData } from '@/lib/sampleData';
import { SAMPLE_PLAYERS } from '@/components/leaderboard/samplePlayers';
import PageIntro from '@/components/shared/PageIntro';
import type { Locale } from '@/i18n/config';
import { accountPlayers } from '@/lib/stats';

// Lit la base à chaque requête : la page ne doit pas être prérendue au build (la base n'est pas joignable à ce moment-là).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/[locale]/leaderboard'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Leaderboard' });
  return { title: t('metaTitle') };
}

// Classement général des joueurs (STAT-8).
export default async function LeaderboardPage({ params }: PageProps<'/[locale]/leaderboard'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('Leaderboard');
  // Comptes réels, et en développement les joueurs de démonstration dont aucun compte ne porte le nom.
  const accounts = await accountPlayers();
  const taken = new Set(accounts.map((p) => p.username.toLowerCase()));
  const players = [...accounts, ...(showSampleData() ? SAMPLE_PLAYERS.filter((p) => !taken.has(p.username.toLowerCase())) : [])];

  return (
    <>
      <SiteHeader />
      <main className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        <section aria-labelledby="leaderboard-title" className="relative mx-auto flex max-w-[1152px] flex-col gap-10 px-6 pt-14 pb-24">
          <PageIntro id="leaderboard-title" eyebrow={t('eyebrow')} title={t('title')} watermark={t('watermark')} />
          {/* useSearchParams : la liste se rend côté client, avec l'état lu dans l'URL. */}
          <Suspense fallback={<div className="min-h-[480px]" />}>
            <LeaderboardBrowser players={players} />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
