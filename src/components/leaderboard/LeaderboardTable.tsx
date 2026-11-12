import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CATEGORIES, type LeaderboardCategory, type RankedPlayer } from './leaderboard';
import { FramedAvatar } from './Podium';
import { useMetric } from './useMetric';

/** Colonnes partagées par l'en-tête et les rangées : rang, joueur, puis la catégorie choisie (téléphone) ou les quatre. */
const COLUMNS = 'grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-x-3 md:grid-cols-[64px_minmax(0,1fr)_100px_110px_130px_150px]';

// Classement général à partir du 4e (ou toutes les correspondances d'une recherche), en rangées pointées.
// Sur téléphone : rang, joueur et valeur de la catégorie choisie seulement.
export default function LeaderboardTable({ players, category }: { players: RankedPlayer[]; category: LeaderboardCategory }) {
  const t = useTranslations('Leaderboard');
  const metric = useMetric();

  return (
    <table className="block w-full text-left">
      <caption className="sr-only">{t('tableCaption', { category: t(`categories.${category}`) })}</caption>
      <thead className="font-label-code block text-[11px] uppercase tracking-[0.16em] text-outline">
        <tr className={`${COLUMNS} px-[34px] pb-1.5`}>
          <th scope="col" className="font-medium">{t('columns.rank')}</th>
          <th scope="col" className="font-medium">{t('columns.player')}</th>
          <th scope="col" className="text-right font-medium text-primary md:hidden">{t(`categories.${category}`)}</th>
          {CATEGORIES.map((c) => (
            <th
              key={c}
              scope="col"
              aria-sort={c === category ? (c === 'errors' ? 'ascending' : 'descending') : undefined}
              className={`hidden items-center justify-end gap-1.5 font-medium whitespace-nowrap md:flex ${c === category ? 'text-primary' : ''}`}
            >
              {c === category && (
                <svg aria-hidden="true" viewBox="0 0 10 10" className="size-1.5 rotate-180 text-primary-text">
                  <path d="M5 0 10 10 5 7 0 10z" fill="currentColor" />
                </svg>
              )}
              {t(`categories.${c}`)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="flex flex-col gap-1.5">
        {players.map((player) => (
          <tr key={player.username} className={`hx-row ${COLUMNS} min-h-14 px-[34px] [--h:18px]`}>
            <td className="font-label-code text-[14px] text-outline">#{player.rank}</td>
            <td className="min-w-0">
              {/* Le lien couvre toute la rangée (::after) : cliquer n'importe où ouvre le profil. */}
              <Link
                href={`/profile/${player.username}`}
                aria-label={t('profileLabel', { name: player.username })}
                className="flex min-w-0 items-center gap-3 text-on-primary-container after:absolute after:inset-0 hover:text-on-primary-container"
              >
                <FramedAvatar player={player} size={30} frame="bg-[#8f1022]" />
                <span className="font-grotesk truncate text-[17px]">{player.username}</span>
              </Link>
            </td>
            <td className="font-label-code text-right text-[15px] font-bold whitespace-nowrap md:hidden">{metric(category, player)}</td>
            {CATEGORIES.map((c) => (
              <td key={c} className={`font-label-code hidden text-right text-[14px] whitespace-nowrap md:block ${c === category ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                {metric(c, player)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
