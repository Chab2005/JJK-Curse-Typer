import { useTranslations } from 'next-intl';
import Avatar from '@/components/shared/Avatar';
import type { CharacterId } from '@/components/shared/characters';
import { Link } from '@/i18n/navigation';
import type { LeaderboardCategory, RankedPlayer } from './leaderboard';
import { useMetric } from './useMetric';

/** Métal du classement : or pour la 1re place, argent pour la 2e, bronze pour la 3e (cadre de la carte, rang, cadre de l'avatar).
 * Partagé avec le podium de fin de course. */
export const METALS = [
  { frame: 'bg-gold', ink: 'text-gold' },
  { frame: 'bg-[#d9dce3]', ink: 'text-[#d9dce3]' },
  { frame: 'bg-[#d08a52]', ink: 'text-[#d08a52]' },
] as const;

// Les trois premiers de la catégorie choisie, en cartes pointées (canvas « Classement · style cramoisi ») :
// cadre de métal, vide, filet cramoisi et face. Chaque carte mène au profil du joueur.
export default function Podium({ players, category }: { players: RankedPlayer[]; category: LeaderboardCategory }) {
  const t = useTranslations('Leaderboard');
  const metric = useMetric();
  const [first, ...others] = players;
  if (!first) return null;

  return (
    <section aria-label={t('podium')} className="flex flex-col gap-3.5">
      <Link
        href={`/profile/${first.username}`}
        aria-label={t('profileLabel', { name: first.username })}
        className={`hx-cut block p-px transition-[filter] duration-300 [--h:30px] hover:brightness-135 ${METALS[0].frame}`}
      >
        <span className="hx-cut block bg-[#0b0405] p-[3px] [--h:29.5px]">
          <span className="hx-cut block bg-primary-container/45 p-px [--h:27.5px]">
            <span className="hx-cut flex flex-wrap items-center gap-x-[26px] gap-y-3 bg-[radial-gradient(90%_160%_at_20%_0%,#4a0d14_0%,#1a0709_55%,#0c0304_100%)] px-12 py-[26px] [--h:27px] sm:px-16">
              <span className={`font-grotesk text-[48px] leading-none font-bold sm:text-[60px] ${METALS[0].ink}`}>1</span>
              <FramedAvatar player={first} size={76} frame={METALS[0].frame} />
              <span className="font-grotesk min-w-0 flex-1 basis-40 truncate text-[24px] font-semibold text-on-primary-container sm:text-[28px]">{first.username}</span>
              <span className="font-grotesk text-[32px] leading-none font-bold text-on-primary-container [text-shadow:0_0_18px_rgb(225_29_72/0.6)] sm:text-[42px]">{metric(category, first)}</span>
            </span>
          </span>
        </span>
      </Link>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {others.map((player) => {
          const metal = METALS[player.rank - 1];
          return (
            <Link
              key={player.username}
              href={`/profile/${player.username}`}
              aria-label={t('profileLabel', { name: player.username })}
              className={`hx-cut block p-px transition-[filter] duration-300 [--h:24px] hover:brightness-135 ${metal.frame}`}
            >
              <span className="hx-cut block bg-[#0b0405] p-[3px] [--h:23.5px]">
                <span className="hx-cut block bg-primary-container/45 p-px [--h:21.5px]">
                  <span className="hx-cut flex min-h-[84px] flex-wrap items-center gap-x-4 gap-y-2 bg-linear-to-r from-[#1a0709] to-[#110506] px-10 py-3 [--h:21px]">
                    <span className={`font-grotesk text-[34px] leading-none font-bold ${metal.ink}`}>{player.rank}</span>
                    <FramedAvatar player={player} size={48} frame={metal.frame} />
                    <span className="font-grotesk min-w-0 flex-1 basis-28 truncate text-[19px] font-semibold text-on-primary-container">{player.username}</span>
                    <span className="font-grotesk ml-auto text-[22px] font-bold whitespace-nowrap text-on-surface">{metric(category, player)}</span>
                  </span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// Avatar biseauté dans un cadre de la couleur de la place, comme l'avatar de l'en-tête : filet, marge, photo.
export function FramedAvatar({ player, size, frame }: { player: { username: string; avatar: CharacterId | null; photo?: string | null }; size: number; frame: string }) {
  return (
    <span className={`bevel flex shrink-0 p-px ${frame}`}>
      <span className="bevel flex bg-surface-container-lowest p-0.5">
        <Avatar avatar={player.avatar} name={player.username} src={player.photo} size={size} shape="bevel" />
      </span>
    </span>
  );
}
