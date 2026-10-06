import { useFormatter, useTranslations } from 'next-intl';
import Avatar from '@/components/shared/Avatar';
import type { SummaryRow } from './RaceSummary';

// Le reste du classement de la course (à partir du 4e), dans le style du tableau du classement général.
// Sur téléphone : rang, joueur et MPM seulement.
export default function RaceResultsTable({ rows }: { rows: SummaryRow[] }) {
  const t = useTranslations('Race.summary');
  const tStatus = useTranslations('Race.status');
  const format = useFormatter();

  return (
    <table className="w-full border-separate border-spacing-y-1.5 text-left">
      <caption className="sr-only">{t('results')}</caption>
      <thead className="font-label-code text-[11px] uppercase tracking-[0.16em] text-outline">
        <tr>
          <th scope="col" className="px-3 pb-1 font-medium sm:px-4">{t('rank')}</th>
          <th scope="col" className="px-3 pb-1 font-medium">{t('name')}</th>
          <th scope="col" className="px-3 pb-1 text-right font-medium text-primary">{t('wpm')}</th>
          <th scope="col" className="hidden px-3 pb-1 text-right font-medium md:table-cell">{t('accuracy')}</th>
          <th scope="col" className="hidden px-3 pb-1 pr-5 text-right font-medium md:table-cell">{t('state')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const cell = `${row.you ? 'bg-primary-container/20' : 'bg-surface-container-low'} py-3 transition-colors group-hover:bg-surface-container-high`;
          return (
            <tr key={row.id} className="group">
              <td className={`${cell} font-label-code px-3 text-[15px] text-outline sm:px-4`}>#{row.rank}</td>
              {/* w-full + max-w-0 : la colonne prend la place libre et le nom se tronque au lieu d'élargir le tableau. */}
              <td className={`${cell} w-full max-w-0 px-3`}>
                <span className="flex min-w-0 items-center gap-3 text-on-surface">
                  <Avatar avatar={row.avatar} src={row.photo} name={row.name} size={34} />
                  <span className="font-grotesk truncate text-[17px]">{row.name}</span>
                  {row.you && <span className="font-label-code shrink-0 text-[12px] text-primary">{t('you')}</span>}
                </span>
              </td>
              <td className={`${cell} font-label-code px-3 text-right text-[15px] font-bold whitespace-nowrap text-on-surface max-md:pr-5`}>{t('wpmValue', { value: row.wpm })}</td>
              <td className={`${cell} font-label-code hidden px-3 text-right text-[14px] whitespace-nowrap text-on-surface-variant md:table-cell`}>
                {format.number(row.accuracy, { style: 'percent', maximumFractionDigits: 1 })}
              </td>
              <td className={`${cell} font-label-code hidden px-3 pr-5 text-right text-[13px] whitespace-nowrap text-on-surface-variant md:table-cell`}>{tStatus(row.status)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
