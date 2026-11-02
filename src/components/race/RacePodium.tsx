import { useFormatter, useTranslations } from 'next-intl';
import { FramedAvatar, METALS } from '@/components/leaderboard/Podium';
import type { SummaryRow } from './RaceSummary';

// Les trois premiers de la course, en cartes pointées comme le podium du classement général :
// cadre de métal (or, argent, bronze), vide, filet cramoisi et face.
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
  const racer = (row: SummaryRow) => ({ username: row.name, avatar: row.avatar, photo: row.photo });

  return (
    <section aria-label={t('podium')} className="flex flex-col gap-3.5">
      <div className={`hx-cut p-px [--h:30px] ${METALS[0].frame}`}>
        <div className="hx-cut bg-[#0b0405] p-[3px] [--h:29.5px]">
          <div className="hx-cut bg-primary-container/45 p-px [--h:27.5px]">
            <div className="hx-cut flex flex-wrap items-center gap-x-[26px] gap-y-3 bg-[radial-gradient(90%_160%_at_20%_0%,#4a0d14_0%,#1a0709_55%,#0c0304_100%)] px-12 py-[26px] [--h:27px] sm:px-16">
              <span className={`font-grotesk text-[48px] leading-none font-bold sm:text-[60px] ${METALS[0].ink}`}>01</span>
              <FramedAvatar player={racer(first)} size={76} frame={METALS[0].frame} />
              <span className="flex min-w-0 flex-1 basis-40 flex-col">
                <span className="font-grotesk truncate text-[24px] font-semibold text-on-primary-container sm:text-[28px]">{name(first)}</span>
                <span className="text-[15px] text-on-surface-variant">{detail(first)}</span>
              </span>
              <span className="font-grotesk text-[32px] leading-none font-bold text-on-primary-container [text-shadow:0_0_18px_rgb(225_29_72/0.6)] sm:text-[42px]">
                {t('wpmValue', { value: first.wpm })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {others.map((row, i) => {
            const metal = METALS[i + 1];
            return (
              <div key={row.id} className={`hx-cut p-px [--h:24px] ${metal.frame}`}>
                <div className="hx-cut h-full bg-[#0b0405] p-[3px] [--h:23.5px]">
                  <div className="hx-cut h-full bg-primary-container/45 p-px [--h:21.5px]">
                    <div className="hx-cut flex h-full min-h-[84px] flex-wrap items-center gap-x-4 gap-y-2 bg-linear-to-r from-[#1a0709] to-[#110506] px-10 py-3 [--h:21px]">
                      <span className={`font-grotesk text-[34px] leading-none font-bold ${metal.ink}`}>{String(row.rank).padStart(2, '0')}</span>
                      <FramedAvatar player={racer(row)} size={48} frame={metal.frame} />
                      <span className="flex min-w-0 flex-1 basis-28 flex-col">
                        <span className="font-grotesk truncate text-[19px] font-semibold text-on-primary-container">{name(row)}</span>
                        <span className="text-[13px] text-on-surface-variant">{detail(row)}</span>
                      </span>
                      <span className="font-grotesk ml-auto text-[22px] font-bold whitespace-nowrap text-on-surface">{t('wpmValue', { value: row.wpm })}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
