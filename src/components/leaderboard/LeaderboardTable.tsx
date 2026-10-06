import { useTranslations } from 'next-intl';
import Avatar from '@/components/shared/Avatar';
import { Link } from '@/i18n/navigation';
import { CATEGORIES, type LeaderboardCategory, type RankedPlayer } from './leaderboard';
import { useMetric } from './useMetric';

// Classement général à partir du 4e (ou toutes les correspondances d'une recherche).
// Sur téléphone : rang, joueur et valeur de la catégorie choisie seulement.
export default function LeaderboardTable({ players, category }: { players: RankedPlayer[]; category: LeaderboardCategory }) {
  const t = useTranslations('Leaderboard');
  const metric = useMetric();
  const header = (c: LeaderboardCategory) => (c === category ? 'text-primary' : '');

  return (
    <table className="w-full border-separate border-spacing-y-1.5 text-left">
      <caption className="sr-only">{t('tableCaption', { category: t(`categories.${category}`) })}</caption>
      <thead className="font-label-code text-[11px] uppercase tracking-[0.16em] text-outline">
        <tr>
          <th scope="col" className="px-3 pb-1 font-medium sm:px-4">{t('columns.rank')}</th>
          <th scope="col" className="px-3 pb-1 font-medium">{t('columns.player')}</th>
          <th scope="col" className="px-3 pb-1 text-right font-medium md:hidden">{t(`categories.${category}`)}</th>
          {CATEGORIES.map((c) => (
            <th
              key={c}
              scope="col"
              aria-sort={c === category ? (c === 'errors' ? 'ascending' : 'descending') : undefined}
              className={`hidden px-3 pb-1 text-right font-medium md:table-cell ${header(c)}`}
            >
              {t(`categories.${c}`)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((player) => {
          const cell = 'bg-surface-container-low py-3 transition-colors group-hover:bg-surface-container-high';
          return (
            <tr key={player.username} className="group relative">
              <td className={`${cell} font-label-code px-3 text-[15px] text-outline sm:px-4`}>#{player.rank}</td>
              {/* w-full + max-w-0 : la colonne prend la place libre et le nom se tronque au lieu d'élargir le tableau. */}
              <td className={`${cell} w-full max-w-0 px-3`}>
                {/* Le lien couvre toute la ligne (::after) : cliquer n'importe où ouvre le profil. */}
                <Link
                  href={`/profile/${player.username}`}
                  aria-label={t('profileLabel', { name: player.username })}
                  className="flex min-w-0 items-center gap-3 text-on-surface after:absolute after:inset-0 hover:text-on-surface"
                >
                  <Avatar avatar={player.avatar} name={player.username} src={player.photo} size={34} />
                  <span className="font-grotesk truncate text-[17px]">{player.username}</span>
                </Link>
              </td>
              <td className={`${cell} font-label-code px-4 text-right text-[15px] font-bold whitespace-nowrap md:hidden`}>{metric(category, player)}</td>
              {CATEGORIES.map((c) => (
                <td
                  key={c}
                  className={`${cell} font-label-code hidden px-3 text-right text-[14px] whitespace-nowrap last:pr-5 md:table-cell ${
                    c === category ? 'font-bold text-on-surface' : 'text-on-surface-variant'
                  }`}
                >
                  {metric(c, player)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
