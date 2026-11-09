import { useFormatter, useTranslations } from 'next-intl';
import { FramedAvatar } from '@/components/leaderboard/Podium';
import type { SummaryRow } from './RaceSummary';

/** Colonnes partagées par l'en-tête et les rangées : rang, joueur, MPM, puis précision et état sur grand écran. */
const COLUMNS = 'grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-x-3 md:grid-cols-[64px_minmax(0,1fr)_100px_110px_140px]';

// Le reste du classement de la course (à partir du 4e), en rangées pointées comme le classement général ;
// la rangée du joueur a un cadre cramoisi vif. Sur téléphone : rang, joueur et MPM seulement.
export default function RaceResultsTable({ rows }: { rows: SummaryRow[] }) {
  const t = useTranslations('Race.summary');
  const tStatus = useTranslations('Race.status');
  const format = useFormatter();

  return (
    <table role="table" className="block w-full text-left">
      <caption className="sr-only">{t('results')}</caption>
      <thead role="rowgroup" className="font-label-code block text-[11px] uppercase tracking-[0.16em] text-outline">
        <tr role="row" className={`${COLUMNS} px-[34px] pb-1.5`}>
          <th role="columnheader" scope="col" className="font-medium">{t('rank')}</th>
          <th role="columnheader" scope="col" className="font-medium">{t('name')}</th>
          <th role="columnheader" scope="col" className="text-right font-medium text-primary">{t('wpm')}</th>
          <th role="columnheader" scope="col" className="hidden text-right font-medium md:block">{t('accuracy')}</th>
          <th role="columnheader" scope="col" className="hidden text-right font-medium md:block">{t('state')}</th>
        </tr>
      </thead>
      <tbody role="rowgroup" className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <tr role="row"
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
              </span>
            </td>
            <td role="cell" className="font-label-code text-right text-[15px] font-bold whitespace-nowrap text-on-surface">{t('wpmValue', { value: row.wpm })}</td>
            <td role="cell" className="font-label-code hidden text-right text-[14px] whitespace-nowrap text-on-surface-variant md:block">
              {format.number(row.accuracy, { style: 'percent', maximumFractionDigits: 1 })}
            </td>
            <td role="cell" className="font-label-code hidden text-right text-[13px] whitespace-nowrap text-on-surface-variant md:block">{tStatus(row.status)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
