import { useFormatter, useTranslations } from 'next-intl';
import { FramedAvatar } from '@/components/leaderboard/Podium';
import BotBadge from './BotBadge';
import PersonalBestBadge from './PersonalBestBadge';
import type { SummaryRow } from './RaceSummary';

/** Colonnes partagées par l'en-tête et les rangées : rang, joueur, MPM sur téléphone ; le détail apparaît avec la largeur (RES-02). */
const COLUMNS =
  'grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3 md:grid-cols-[52px_minmax(0,1fr)_84px_84px_84px] lg:grid-cols-[52px_minmax(0,1fr)_84px_84px_84px_64px_72px_88px_120px]';

/** 75 500 ms → « 1:15.5 » ; `—` tant que le coureur n'a pas fini. */
export function formatRaceTime(ms: number | null): string {
  if (ms === null) return '—';
  const tenths = Math.floor(Math.max(0, ms) / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths % 10}`;
}

// Classement complet de la course, podium compris, en rangées pointées comme le classement général (RES-02) :
// rang, participant, MPM net et brut, précision, erreurs, temps, bonus reçus et état. La rangée du joueur a un cadre cramoisi vif.
// Sur téléphone : rang, joueur et MPM seulement ; le reste apparaît avec la largeur.
export default function RaceResultsTable({ rows }: { rows: SummaryRow[] }) {
  const t = useTranslations('Race.summary');
  const tStatus = useTranslations('Race.status');
  const format = useFormatter();
  const detail = 'font-label-code hidden text-right whitespace-nowrap text-on-surface-variant';

  return (
    <table role="table" className="block w-full text-left">
      <caption className="sr-only">{t('results')}</caption>
      <thead role="rowgroup" className="font-label-code block text-[11px] uppercase tracking-[0.16em] text-outline">
        <tr role="row" className={`${COLUMNS} px-[34px] pb-1.5`}>
          <th role="columnheader" scope="col" className="font-medium">{t('rank')}</th>
          <th role="columnheader" scope="col" className="font-medium">{t('name')}</th>
          <th role="columnheader" scope="col" className="text-right font-medium text-primary">{t('wpm')}</th>
          <th role="columnheader" scope="col" className="hidden text-right font-medium md:block">{t('rawWpm')}</th>
          <th role="columnheader" scope="col" className="hidden text-right font-medium md:block">{t('accuracy')}</th>
          <th role="columnheader" scope="col" className="hidden text-right font-medium lg:block">{t('errors')}</th>
          <th role="columnheader" scope="col" className="hidden text-right font-medium lg:block">{t('time')}</th>
          <th role="columnheader" scope="col" className="hidden text-right font-medium lg:block">{t('bonuses')}</th>
          <th role="columnheader" scope="col" className="hidden text-right font-medium lg:block">{t('state')}</th>
        </tr>
      </thead>
      <tbody role="rowgroup" className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <tr
            role="row"
            key={row.id}
            className={`hx-row ${COLUMNS} min-h-14 px-[34px] [--h:18px]`}
            style={row.you ? ({ '--row-frame': 'var(--color-primary-container)' } as React.CSSProperties) : undefined}
          >
            <td role="cell" className="font-label-code text-[14px] text-outline">#{row.rank}</td>
            <td role="cell" className="min-w-0">
              <span className="flex min-w-0 items-center gap-3 text-on-primary-container">
                <FramedAvatar player={{ username: row.name, avatar: row.avatar, photo: row.photo }} size={30} frame="bg-[#8f1022]" />
                <span className="font-grotesk truncate text-[17px]">{row.name}</span>
                {row.you && <span className="font-label-code shrink-0 text-[12px] text-primary">{t('you')}</span>}
                {row.bot && <BotBadge />}
                {/* Place gardée pour chaque humain : le record arrive après l'enregistrement de la course (RES-04). */}
                {!row.bot && <PersonalBestBadge shown={row.record === true} />}
              </span>
            </td>
            <td role="cell" className="font-label-code text-right text-[15px] font-bold whitespace-nowrap text-on-surface">{t('wpmValue', { value: row.wpm })}</td>
            <td role="cell" className={`${detail} text-[14px] md:block`}>{t('wpmValue', { value: row.rawWpm })}</td>
            <td role="cell" className={`${detail} text-[14px] md:block`}>{format.number(row.accuracy, { style: 'percent', maximumFractionDigits: 1 })}</td>
            <td role="cell" className={`${detail} text-[14px] lg:block`}>{format.number(row.errors)}</td>
            <td role="cell" className={`${detail} text-[14px] lg:block`}>{formatRaceTime(row.endedAt)}</td>
            <td role="cell" className={`${detail} text-[14px] lg:block`}>{format.number(row.received)}</td>
            <td role="cell" className={`${detail} text-[13px] lg:block`}>{tStatus(row.status)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
