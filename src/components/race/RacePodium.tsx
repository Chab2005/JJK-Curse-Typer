import { useFormatter, useTranslations } from 'next-intl';
import { PLACES } from '@/components/leaderboard/Podium';
import Avatar from '@/components/shared/Avatar';
import type { SummaryRow } from './RaceSummary';

// Les trois premiers de la course, avec la même mise en scène que le podium du classement général.
// Pas de lien vers le profil : les bots et les invités n'en ont pas.
export default function RacePodium({ rows }: { rows: SummaryRow[] }) {
  const t = useTranslations('Race.summary');
  const tStatus = useTranslations('Race.status');
  const format = useFormatter();
  const [first, ...others] = rows.slice(0, 3);
  if (!first) return null;

  const detail = (row: SummaryRow) =>
    t('detail', { status: tStatus(row.status), accuracy: format.number(row.accuracy, { style: 'percent', maximumFractionDigits: 1 }) });
  const name = (row: SummaryRow) => (
    <>
      {row.name}
      {row.you && <span className="font-label-code ml-2 text-[13px] font-normal text-primary">{t('you')}</span>}
    </>
  );

  return (
    <section aria-label={t('podium')} className="flex flex-col gap-4">
      <div className="bevel block p-px bg-linear-135 from-gold to-gold-deep">
        <div className="bevel flex flex-wrap items-center gap-x-6 gap-y-3 bg-[linear-gradient(90deg,#4a0d14,#1c1b1d_65%)] px-6 py-6 sm:px-8">
          <span className="font-grotesk text-[44px] leading-none font-bold text-gold sm:text-[56px]">01</span>
          <Avatar avatar={first.avatar} src={first.photo} name={first.name} size={76} className="ring-2 ring-gold ring-offset-4 ring-offset-surface-container-low" />
          <span className="flex min-w-0 flex-1 basis-40 flex-col">
            <span className="font-grotesk truncate text-[24px] font-semibold text-on-surface sm:text-[28px]">{name(first)}</span>
            <span className="text-[15px] text-on-surface-variant">{detail(first)}</span>
          </span>
          <span className="font-grotesk text-[32px] leading-none font-bold text-on-primary-container sm:text-[40px]">{t('wpmValue', { value: first.wpm })}</span>
        </div>
      </div>

      {others.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {others.map((row) => {
            const place = PLACES[row.rank - 1];
            return (
              <div key={row.id} className={`bevel block p-px ${place.frame}`}>
                <div className="bevel flex h-full flex-wrap items-center gap-x-4 gap-y-2 bg-surface-container-low px-5 py-4">
                  <span className={`font-grotesk text-[34px] leading-none font-bold ${place.ink}`}>{String(row.rank).padStart(2, '0')}</span>
                  <Avatar avatar={row.avatar} src={row.photo} name={row.name} size={48} className={`ring-2 ring-offset-2 ring-offset-surface-container-low ${place.ring}`} />
                  <span className="flex min-w-0 flex-1 basis-32 flex-col">
                    <span className="font-grotesk truncate text-[19px] font-semibold text-on-surface">{name(row)}</span>
                    <span className="text-[13px] text-on-surface-variant">{detail(row)}</span>
                  </span>
                  <span className="font-grotesk ml-auto text-[22px] font-bold whitespace-nowrap text-on-surface">{t('wpmValue', { value: row.wpm })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
