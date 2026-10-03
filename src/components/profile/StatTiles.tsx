import { useFormatter, useTranslations } from 'next-intl';
import type { Profile } from './sampleProfiles';

// Statistiques principales du joueur (STAT-2, PROF-4).
export default function StatTiles({ profile }: { profile: Profile }) {
  const t = useTranslations('Profile.stats');
  const format = useFormatter();

  const tiles = [
    { key: 'wpm', value: format.number(profile.wpm), unit: t('wpmUnit'), ink: 'text-primary' },
    { key: 'accuracy', value: format.number(profile.accuracy, { style: 'percent', maximumFractionDigits: 1 }), ink: 'text-tertiary' },
    { key: 'errors', value: format.number(profile.errorsPer100, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), unit: t('errorsUnit'), ink: 'text-on-surface' },
    { key: 'score', value: format.number(profile.averageScore), unit: t('scoreUnit'), ink: 'text-secondary' },
  ] as const;

  return (
    <section aria-label={t('label')}>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] border-y border-primary/25">
        {tiles.map((tile) => (
          <div key={tile.key} className="flex flex-col-reverse gap-1 border-b border-primary/10 px-5 py-6 sm:border-r sm:border-b-0 sm:last:border-r-0">
            <dt className="font-occult text-base text-on-surface-variant">{t(tile.key)}</dt>
            <dd className={`font-grotesk text-[44px] leading-[1.05] font-bold ${tile.ink}`}>
              {tile.value}
              {'unit' in tile && <span className="font-grotesk ml-1.5 text-[18px] font-medium text-on-surface-variant">{tile.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
