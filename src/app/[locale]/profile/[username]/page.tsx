import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Avatar from '@/components/shared/Avatar';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import KeyboardHeatmap from '@/components/profile/KeyboardHeatmap';
import ProfileHeader from '@/components/profile/ProfileHeader';
import StatTiles from '@/components/profile/StatTiles';
import WpmChart from '@/components/profile/WpmChart';
import { showSampleData } from '@/lib/sampleData';
import { findSampleProfile } from '@/components/profile/sampleProfiles';
import type { Locale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { findAccountProfile } from '@/lib/auth/profile';

export async function generateMetadata({ params }: PageProps<'/[locale]/profile/[username]'>) {
  const { username } = await params;
  return { title: decodeURIComponent(username) };
}

// Profil public d'un joueur (PROF-4) et son tableau de bord (STAT-1 à STAT-4).
export default async function ProfilePage({ params }: PageProps<'/[locale]/profile/[username]'>) {
  const { locale, username } = await params;
  setRequestLocale(locale as Locale);
  const now = new Date();
  const name = decodeURIComponent(username);
  const profile = showSampleData() ? findSampleProfile(name, now) : null;
  const t = await getTranslations('Profile');
  const viewer = await getSessionUser();

  // Compte réel : nom affiché, photo et nombre de courses ; les statistiques détaillées viendront avec les courses en base.
  if (!profile) {
    const account = await findAccountProfile(name);
    if (!account) notFound();
    return (
      <>
        <SiteHeader />
        <main className="relative w-full flex-1 overflow-hidden bg-surface">
          <div className="relative mx-auto flex max-w-[960px] flex-col gap-6 px-6 pt-14 pb-24">
            <section aria-labelledby="profile-title" className="flex flex-wrap items-center gap-x-8 gap-y-5">
              <Avatar avatar={null} name={account.displayName} src={account.avatarUrl} size={148} className="ring-2 ring-primary-container ring-offset-4 ring-offset-surface" />
              <div className="flex min-w-0 flex-1 basis-60 flex-col gap-2">
                <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
                <h1 id="profile-title" className="font-grotesk text-[clamp(30px,4vw,42px)] leading-tight font-semibold break-words">{account.displayName}</h1>
                <p className="font-label-code text-[14px] text-outline">@{account.username}{account.country ? ` · ${account.country}` : ''}</p>
                <p className="font-label-code text-[12px] text-outline">{t('games', { games: account.games })}</p>
                {viewer?.id === account.id && (
                  <Link href="/settings" className="font-label-code mt-2 inline-flex min-h-8 items-center gap-2 self-start text-[14px] text-primary hover:text-primary-fixed">
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">edit</span>
                    {t('editSettings')}
                  </Link>
                )}
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_45%_70%_at_25%_0%,rgb(49_49_192/0.35),transparent_70%),radial-gradient(ellipse_40%_60%_at_80%_0%,rgb(147_0_10/0.35),transparent_70%)]" />
        <div className="relative mx-auto flex max-w-[960px] flex-col gap-10 px-6 pt-14 pb-24">
          <ProfileHeader
            profile={{ username: profile.username, avatar: profile.avatar, github: profile.github, discord: profile.discord }}
            own={false}
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
