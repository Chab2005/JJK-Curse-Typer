import { useFormatter, useTranslations } from 'next-intl';
import { spriteStyle } from '@/components/characters/characterSprites';
import { CHARACTERS } from '@/components/shared/characters';
import type { CharacterGames } from '@/game/stats';
import { Link } from '@/i18n/navigation';

// Personnage le plus joué (PROF-4), à gauche des statistiques : son pixel art dans un hexagone à quatre couches
// (cadre, vide, filet, face). Il joue sa bande idle et passe à la course au survol ou au focus du bloc.
const SPRITE_SCALE = 0.42;

export default function MostPlayedCharacter({ character, totalGames }: { character: CharacterGames; totalGames: number }) {
  const t = useTranslations('Profile.stats.mostPlayed');
  const tc = useTranslations('Characters.techniques');
  const format = useFormatter();
  const { id, name } = CHARACTERS.find((c) => c.id === character.character)!;
  const share = totalGames > 0 ? Math.min(1, character.games / totalGames) : 0;

  return (
    <article aria-labelledby="most-played" className="group flex min-w-0 flex-[0_1_300px] flex-col items-center gap-1.5 text-center">
      <div className="hx-cut w-[230px] bg-[#8f1022] p-px drop-shadow-[0_0_18px_rgb(225_29_72/0.35)] transition-[filter] duration-200 [--h:46px] group-hover:brightness-115 group-hover:drop-shadow-[0_0_22px_rgb(225_29_72/0.5)] motion-reduce:transition-none">
        <div className="hx-cut bg-[#0b0405] p-[3px] [--h:45.5px]">
          <div className="hx-cut bg-primary-container/40 p-px [--h:44px]">
            <div className="hx-cut relative h-[166px] overflow-hidden bg-[radial-gradient(ellipse_70%_80%_at_50%_40%,rgb(76_215_246/0.3),#140608_75%)] [--h:43.5px]">
              <span aria-hidden="true" className="absolute bottom-2.5 left-1/2 h-3 w-[88px] -translate-x-1/2 rounded-[50%] bg-black/55" />
              <span aria-hidden="true" className="absolute bottom-3 left-1/2 block -translate-x-1/2 group-focus-within:hidden group-hover:hidden motion-reduce:[animation:none]!" style={spriteStyle(id, 'idle', SPRITE_SCALE)} />
              <span aria-hidden="true" className="absolute bottom-3.5 left-1/2 hidden -translate-x-1/2 group-focus-within:block group-hover:block motion-reduce:[animation:none]!" style={spriteStyle(id, 'running', SPRITE_SCALE)} />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2.5 flex items-center gap-2 font-label-code text-[11px] uppercase tracking-[0.16em] text-[#c9aeaf]">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary-text">swords</span>
        {t('title')}
      </p>
      <h2 id="most-played" className="font-grotesk text-[28px] leading-tight font-semibold text-[#fffaf9]">{name}</h2>
      <p className="text-[16px] text-[#acedff]">{tc(id)}</p>
      <div className="mt-2 flex w-[220px] flex-col gap-1.5">
        <div aria-hidden="true" className="h-1.5 bg-[#2a1416] [clip-path:polygon(3px_0,100%_0,calc(100%-3px)_100%,0_100%)]">
          <div className="h-full bg-linear-to-r from-[#a3102f] to-primary-container" style={{ width: `${share * 100}%` }} />
        </div>
        <span className="font-label-code text-[12px] text-[#c9aeaf]">
          {t.rich('usage', {
            count: character.games,
            share: format.number(share, { style: 'percent', maximumFractionDigits: 0 }),
            total: totalGames,
            strong: (chunks) => <strong className="font-bold text-primary">{chunks}</strong>,
          })}
        </span>
      </div>
      <Link href={`/characters/${id}`} className="inline-flex min-h-11 items-center gap-1.5 font-label-code text-[11px] uppercase tracking-[0.16em] text-primary no-underline hover:text-[#ffdada]">
        {t('sheet')}
        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">arrow_forward</span>
      </Link>
    </article>
  );
}
