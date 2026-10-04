import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// Données de démonstration en attendant le classement général (STAT-8).
const TOP = [
  { name: 'Satoru_Infinity', wpm: 182, accuracy: 0.991, color: 'text-gold' },
  { name: 'Yuta_Rika', wpm: 171, accuracy: 0.987, color: 'text-secondary' },
  { name: 'Maki_Heavenly', wpm: 165, accuracy: 0.982, color: 'text-tertiary' },
  { name: 'Renee_Spagat', wpm: 150, accuracy: 0.97, color: 'text-outline' },
  { name: 'Nobara_Resonance', wpm: 146, accuracy: 0.978, color: 'text-outline' },
];

export default function TopExorcists({ showSamples = true }: { showSamples?: boolean }) {
  const t = useTranslations('TopExorcists');
  const format = useFormatter();

  return (
    <section aria-labelledby="top-title" className="torn-top relative bg-surface px-6 pt-[110px] pb-25">
      <div className="mx-auto flex max-w-[960px] flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-col gap-2">
            <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
            <h2 id="top-title" className="text-[clamp(34px,4.2vw,52px)] leading-tight uppercase tracking-[0.08em]">{t('title')}</h2>
          </div>
          <Link
            href="/leaderboard"
            className="flex min-h-12 items-center gap-2.5 border border-on-surface px-[22px] text-sm uppercase tracking-[0.16em] text-on-surface transition-colors hover:bg-on-surface hover:text-surface-container-lowest"
          >
            {t('cta')}
            <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>

        {!showSamples && <p className="border border-dashed border-outline-variant px-6 py-12 text-center text-lg text-on-surface-variant">{t('empty')}</p>}

        <ol className="border-t border-surface-container-highest">
          {(showSamples ? TOP : []).map((player, index) => (
            <li key={player.name} className="border-b border-surface-container-highest">
              <Link
                href={`/profile/${player.name}`}
                aria-label={t('profileLabel', { name: player.name })}
                className="grid min-h-18 grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 px-3 text-on-surface transition-colors hover:bg-primary-container/12 sm:grid-cols-[64px_minmax(0,1fr)_auto_28px]"
              >
                <p className={`font-grotesk text-[30px] font-bold ${player.color}`}>{String(index + 1).padStart(2, '0')}</p>
                <p className="font-grotesk truncate text-[19px]">{player.name}</p>
                <p className="font-label-code text-[15px]">
                  <strong className="text-xl">{player.wpm}</strong> {t('wpm')}
                  <span className="font-label-code hidden sm:inline"> ·{format.number(player.accuracy, { style: 'percent', maximumFractionDigits: 1 })}</span>
                </p>
                <span aria-hidden="true" className="material-symbols-outlined hidden text-xl text-outline sm:inline">chevron_right</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
