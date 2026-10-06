import { useTranslations } from 'next-intl';
import Avatar from '@/components/shared/Avatar';
import { Link } from '@/i18n/navigation';
import type { LeaderboardCategory, RankedPlayer } from './leaderboard';
import { useMetric } from './useMetric';

/** Cadre, encre et anneau des trois places ; partagés avec le podium de fin de course. */
export const PLACES = [
  { frame: 'bg-linear-135 from-gold to-gold-deep', ink: 'text-gold', ring: 'ring-gold' },
  { frame: 'bg-secondary/60', ink: 'text-secondary', ring: 'ring-secondary' },
  { frame: 'bg-tertiary/60', ink: 'text-tertiary', ring: 'ring-tertiary' },
] as const;

// Les trois premiers de la catégorie choisie ; chaque carte mène au profil du joueur.
export default function Podium({ players, category }: { players: RankedPlayer[]; category: LeaderboardCategory }) {
  const t = useTranslations('Leaderboard');
  const metric = useMetric();
  const [first, ...others] = players;
  if (!first) return null;

  return (
    <section aria-label={t('podium')} className="flex flex-col gap-4">
      <Link href={`/profile/${first.username}`} aria-label={t('profileLabel', { name: first.username })} className="group bevel block p-px transition-transform hover:-translate-y-0.5 bg-linear-135 from-gold to-gold-deep">
        <span className="bevel flex flex-wrap items-center gap-x-6 gap-y-3 bg-[linear-gradient(90deg,#4a0d14,#1c1b1d_65%)] px-6 py-6 sm:px-8">
          <span className="font-grotesk text-[44px] leading-none font-bold text-gold sm:text-[56px]">01</span>
          <Avatar avatar={first.avatar} name={first.username} size={76} className="ring-2 ring-gold ring-offset-4 ring-offset-surface-container-low" />
          <span className="flex min-w-0 flex-1 basis-40 flex-col">
            <span className="font-grotesk truncate text-[24px] font-semibold text-on-surface sm:text-[28px]">{first.username}</span>
            <span className="text-[15px] text-on-surface-variant">{t('places.1', { category: t(`categories.${category}`) })}</span>
          </span>
          <span className="font-grotesk text-[32px] leading-none font-bold text-on-primary-container sm:text-[40px]">{metric(category, first)}</span>
        </span>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        {others.map((player) => {
          const place = PLACES[player.rank - 1];
          return (
            <Link
              key={player.username}
              href={`/profile/${player.username}`}
              aria-label={t('profileLabel', { name: player.username })}
              className={`group bevel block p-px transition-transform hover:-translate-y-0.5 ${place.frame}`}
            >
              <span className="bevel flex flex-wrap items-center gap-x-4 gap-y-2 bg-surface-container-low px-5 py-4 transition-colors group-hover:bg-surface-container-high">
                <span className={`font-grotesk text-[34px] leading-none font-bold ${place.ink}`}>{String(player.rank).padStart(2, '0')}</span>
                <Avatar avatar={player.avatar} name={player.username} size={48} className={`ring-2 ring-offset-2 ring-offset-surface-container-low ${place.ring}`} />
                <span className="flex min-w-0 flex-1 basis-32 flex-col">
                  <span className="font-grotesk truncate text-[19px] font-semibold text-on-surface">{player.username}</span>
                  <span className="text-[13px] text-on-surface-variant">{t(`places.${player.rank as 2 | 3}`, { category: t(`categories.${category}`) })}</span>
                </span>
                <span className="font-grotesk ml-auto text-[22px] font-bold whitespace-nowrap text-on-surface">{metric(category, player)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
