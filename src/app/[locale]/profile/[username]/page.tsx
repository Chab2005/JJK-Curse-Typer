import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import KeyboardHeatmap from '@/components/profile/KeyboardHeatmap';
import ProfileHeader from '@/components/profile/ProfileHeader';
import StatTiles from '@/components/profile/StatTiles';
import WpmChart from '@/components/profile/WpmChart';
import { findSampleProfile } from '@/components/profile/sampleProfiles';
import type { Locale } from '@/i18n/config';
import { SAMPLE_CURRENT_USER } from '@/lib/currentUser';

export async function generateMetadata({ params }: PageProps<'/[locale]/profile/[username]'>) {
  const { username } = await params;
  return { title: decodeURIComponent(username) };
}

// Profil public d'un joueur (PROF-4) et son tableau de bord (STAT-1 à STAT-4).
export default async function ProfilePage({ params }: PageProps<'/[locale]/profile/[username]'>) {
  const { locale, username } = await params;
  setRequestLocale(locale as Locale);
  const now = new Date();
  const profile = findSampleProfile(decodeURIComponent(username), now);
  if (!profile) notFound();
  const t = await getTranslations('Profile');

  return (
    <>
      <Header />
      <main className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_45%_70%_at_25%_0%,rgb(49_49_192/0.35),transparent_70%),radial-gradient(ellipse_40%_60%_at_80%_0%,rgb(147_0_10/0.35),transparent_70%)]" />
        <div className="relative mx-auto flex max-w-[960px] flex-col gap-10 px-6 pt-14 pb-24">
          <ProfileHeader
            profile={{ username: profile.username, avatar: profile.avatar, github: profile.github, discord: profile.discord }}
            own={profile.username === SAMPLE_CURRENT_USER}
            summary={t('summary', { games: profile.games, wins: profile.wins, best: profile.bestWpm })}
          />
          <WpmChart races={profile.races} now={now.toISOString()} />
          <StatTiles profile={profile} />
          <KeyboardHeatmap stats={profile.keyStats} />
        </div>
      </main>
      <Footer />
    </>
  );
}
