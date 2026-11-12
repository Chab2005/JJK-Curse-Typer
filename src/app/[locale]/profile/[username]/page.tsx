import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import ChevronButton from '@/components/shared/ChevronButton';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import ProfileLinks from '@/components/profile/ProfileLinks';
import EmptyStats from '@/components/profile/EmptyStats';
import KeyboardHeatmap from '@/components/profile/KeyboardHeatmap';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileIdentity from '@/components/profile/ProfileIdentity';
import StatTiles from '@/components/profile/StatTiles';
import StatChart from '@/components/profile/StatChart';
import { showSampleData } from '@/lib/sampleData';
import { findSampleProfile } from '@/components/profile/sampleProfiles';
import type { Locale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { findAccountProfile } from '@/lib/auth/profile';
import { accountGames, accountKeyStats, accountMostPlayed } from '@/lib/stats';
import { isWin, mostPlayedCharacter, summarizeGames } from '@/game/stats';

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

  // Compte réel : nom affiché, photo, ses courses enregistrées (STAT-1, STAT-2) et sa carte de chaleur (STAT-3).
  if (!profile) {
    const account = await findAccountProfile(name);
    if (!account) notFound();
    const [games, keys, mostPlayed] = await Promise.all([accountGames(account.id), accountKeyStats(account.id), accountMostPlayed(account.id)]);
    const stats = summarizeGames(games);
    return (
      <>
        <SiteHeader />
        <main id="main" className="relative w-full flex-1 overflow-hidden bg-surface">
          <ProfileGlow />
          <div className="relative mx-auto flex max-w-[1040px] flex-col gap-8 px-6 pt-14 pb-24">
            <ProfileIdentity
              name={account.displayName}
              avatar={null}
              photo={account.avatarUrl}
              summary={stats ? t('summary', { games: stats.games, wins: stats.wins, best: stats.bestWpm }) : t('games', { games: 0 })}
              action={
                viewer && (
                  <div className="flex flex-wrap gap-3">
                    {/* Historique des courses (HIST-01) : le sien sur /history, celui d'un autre joueur sous son profil, pour tout compte connecté. */}
                    <ChevronButton
                      as={Link}
                      href={viewer.id === account.id ? '/history' : `/profile/${encodeURIComponent(account.username)}/history`}
                      size="sm"
                      chevrons={false}
                      className="font-label-code text-[11px] uppercase tracking-[0.16em]"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">history</span>
                      {t('history')}
                    </ChevronButton>
                    {viewer.id === account.id && (
                      <ChevronButton as={Link} href="/settings" size="sm" className="font-label-code text-[11px] uppercase tracking-[0.16em]">
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">settings</span>
                        {t('editSettings')}
                      </ChevronButton>
                    )}
                  </div>
                )
              }
            >
              <ProfileLinks github={account.github} discord={account.discord} />
              <p className="font-label-code text-[14px] text-outline">@{account.username}{account.country ? ` · ${account.country}` : ''}</p>
            </ProfileIdentity>
            {stats ? (
              <>
                <StatChart
                  races={games.map((g) => ({ date: g.at, wpm: g.wpm, accuracy: g.accuracy, errors: g.errors, keystrokes: g.keystrokes, won: isWin(g) }))}
                  now={now.toISOString()}
                />
                <StatTiles profile={stats} mostPlayed={mostPlayed} />
                {keys.length > 0 && <KeyboardHeatmap stats={keys} />}
              </>
            ) : (
              <EmptyStats own={viewer?.id === account.id} />
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative w-full flex-1 overflow-hidden bg-surface">
        <ProfileGlow />
        <div className="relative mx-auto flex max-w-[1040px] flex-col gap-8 px-6 pt-14 pb-24">
          <ProfileHeader
            profile={{ username: profile.username, avatar: profile.avatar, github: profile.github, discord: profile.discord }}
            own={false}
            summary={t('summary', { games: profile.games, wins: profile.wins, best: profile.bestWpm })}
          />
          <StatChart races={profile.races} now={now.toISOString()} />
          <StatTiles profile={profile} mostPlayed={mostPlayedCharacter(profile.characters)} />
          <KeyboardHeatmap stats={profile.keyStats} />
        </div>
      </main>
      <Footer />
    </>
  );
}

// Lueur cramoisie en haut de la page et fondu sombre en bas, comme les arènes et le classement.
function ProfileGlow() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[640px] bg-linear-to-b from-transparent to-[#120708]" />
    </>
  );
}
