import { useFormatter, useTranslations } from 'next-intl';
import type { CharacterGames } from '@/game/stats';
import MostPlayedCharacter from './MostPlayedCharacter';
import type { Profile } from './sampleProfiles';

// Statistiques principales du joueur (STAT-2, PROF-4) : quatre plaques pointées. Le cadre rouge, plus épais en bas,
// dessine une bande sous chaque plaque, soulignée d'un trait cramoisi ; les faces s'étirent à la même hauteur.
// Le personnage le plus joué, s'il y en a un, se place à gauche et les plaques passent en 2 × 2.
export default function StatTiles({
  profile,
  mostPlayed = null,
}: {
  profile: Pick<Profile, 'games' | 'wpm' | 'accuracy' | 'errorsPer100' | 'averageScore'>;
  mostPlayed?: CharacterGames | null;
}) {
  const t = useTranslations('Profile.stats');
  const format = useFormatter();

  const tiles = [
    { key: 'wpm', value: format.number(profile.wpm), unit: t('wpmUnit'), ink: 'text-primary [text-shadow:0_0_18px_rgb(225_29_72/0.45)]' },
    { key: 'accuracy', value: format.number(profile.accuracy, { style: 'percent', maximumFractionDigits: 1 }), ink: 'text-tertiary' },
    { key: 'errors', value: format.number(profile.errorsPer100, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), unit: t('errorsUnit'), ink: 'text-on-primary-container' },
    { key: 'score', value: format.number(profile.averageScore), unit: t('scoreUnit'), ink: 'text-gold' },
  ] as const;

  return (
    <section aria-label={t('label')} className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8">
      {mostPlayed && <MostPlayedCharacter character={mostPlayed} totalGames={profile.games} />}
      <dl className={`grid min-w-0 gap-3.5 ${mostPlayed ? 'flex-[1_1_520px] grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))]' : 'w-full grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))]'}`}>
        {tiles.map((tile) => (
          <div key={tile.key} className="hx-cut relative flex bg-[#8f1022] px-px pt-px pb-3.5 [--h:22px]">
            <div className="hx-cut flex flex-1 flex-col-reverse justify-end gap-1.5 bg-linear-to-r from-[#1a0709] to-[#110506] px-10 py-[22px] [--h:21.5px]">
              <dt className="font-label-code text-[11px] uppercase tracking-[0.16em] text-[#c9aeaf]">{t(tile.key)}</dt>
              <dd className={`font-grotesk text-[44px] leading-none font-bold ${tile.ink}`}>
                {tile.value}
                {'unit' in tile && <span className="font-grotesk ml-1.5 text-[16px] font-medium text-[#c9aeaf] [text-shadow:none]">{tile.unit}</span>}
              </dd>
            </div>
            <span aria-hidden="true" className="absolute inset-x-6 bottom-0 h-[3px] bg-primary-container [clip-path:polygon(4px_0,calc(100%-4px)_0,100%_100%,0_100%)]" />
          </div>
        ))}
      </dl>
    </section>
  );
}
