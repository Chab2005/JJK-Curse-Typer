import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { FramedAvatar } from '@/components/leaderboard/Podium';
import { ABILITY_SPRITES, shikigamiStyle } from '@/components/characters/abilitySprites';
import { spriteStyle } from '@/components/characters/characterSprites';
import BevelPanel from '@/components/shared/BevelPanel';
import { Chevrons } from '@/components/shared/ChevronButton';
import type { AbilityId, TechniqueId } from '@/game/abilities';
import type { RacerMark } from '@/game/powers';
import type { RacerSeat } from '@/game/race';
import BotBadge from './BotBadge';
import type { RaceHit, TrackRunner } from './raceView';

/** Taille des personnages, en fraction du fichier : le meneur et le joueur sont plus gros (RACE-2, RACE-3). */
const SCALE = { big: 0.27, small: 0.2 };
/** Écart vertical entre deux rangs de la piste, en px. */
const LANE_STEP = 24;
/** Place réservée à droite pour que le personnage arrivé reste avant la ligne. */
const FINISH_ROOM = 88;
/** Mahoraga est dessiné plus grand que les exorcistes. */
const MAHORAGA_SCALE = 0.34;
/** Sprite affiché sur un coureur touché. */
const HIT_SCALE = 0.75;

/** Couches du panneau rendues translucides pendant un territoire. */
const SEE_THROUGH = 'bg-[#8f1022]/30! [&_.bpanel-g]:bg-black/30! [&_.bpanel-r]:bg-transparent! [&_.bpanel-c]:[background:transparent]!';

/** Icône de chaque état visible d'un coureur (BONUS-03). */
const MARK_ICONS: Partial<Record<RacerMark, string>> = {
  stunned: 'bolt',
  lagging: 'hourglass_top',
  sealed: 'lock',
  untouchable: 'visibility_off',
  warded: 'shield',
  boosted: 'keyboard_double_arrow_up',
};

/** Bande dans un flux normal : `shikigamiStyle` la place sinon dans sa scène. */
const inFlow = (style: CSSProperties): CSSProperties => ({ ...style, position: 'relative', left: 0, bottom: 0 });

function mahoragaStyle(running: boolean): CSSProperties {
  const sprite = ABILITY_SPRITES.mahoraga!.sprites[0];
  return inFlow(shikigamiStyle(running ? sprite.hover! : sprite.idle, sprite, MAHORAGA_SCALE));
}

function hitStyle(ability: TechniqueId): CSSProperties | null {
  const scene = ABILITY_SPRITES[ability as AbilityId];
  const sprite = scene?.sprites[0];
  return sprite ? shikigamiStyle(sprite.hover ?? sprite.idle, sprite, HIT_SCALE) : null;
}

// Course représentée graphiquement (canvas « Course · style cramoisi ») : la zone d'animation en haut, puis la piste
// où chacun avance vers la ligne d'arrivée, dessiné en personnage : il court quand il avance, il est au repos sinon.
export default function RaceTrack({
  runners,
  banner,
  nameOf,
  hits = [],
  domainOpen = false,
}: {
  runners: TrackRunner[];
  banner: string;
  nameOf: (seat: RacerSeat) => string;
  hits?: readonly RaceHit[];
  /** Un territoire est ouvert derrière l'écran : la piste le laisse voir. */
  domainOpen?: boolean;
}) {
  const t = useTranslations('Race.track');
  const tStatus = useTranslations('Race.status');
  const ranked = [...runners].sort((a, b) => a.rank - b.rank);

  return (
    <BevelPanel as="section" aria-label={t('label')} frame={domainOpen ? SEE_THROUGH : ''}>
      {/* Zone d'animation : dépassements, meneur, plus tard les bonus (RACE-5). */}
      <div className="flex min-h-[58px] items-center justify-center gap-3 border-b border-[#8f1022]/70 px-6 py-3">
        <span aria-hidden="true" className="flex h-5 w-2.5 shrink-0 text-primary-text">
          <Chevrons order="decreasing" className="size-full -scale-x-100" />
        </span>
        <p key={banner} aria-live="polite" className="race-pop text-center text-[20px] tracking-[0.12em] text-on-primary-container uppercase">
          {banner}
        </p>
        <span aria-hidden="true" className="flex h-5 w-2.5 shrink-0 text-primary-text">
          <Chevrons order="decreasing" className="size-full" />
        </span>
      </div>

      <div className="relative mx-6 h-[200px] sm:mx-11">
        {/* Sol de la piste : une ligne qui rougit vers l'arrivée, et ses graduations. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-[34px] h-0.5 bg-linear-to-r from-transparent via-[#8f1022] via-12% to-primary-container" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-[26px] h-[18px] bg-[repeating-linear-gradient(90deg,rgb(225_29_72/0.35)_0_1px,transparent_1px_10%)]" />

        {runners.map((runner) => {
          const name = nameOf(runner.seat);
          const title = [name, runner.leader && t('leader'), runner.you && t('you')].filter(Boolean).join(' · ');
          return (
            <div
              key={runner.seat.id}
              title={title}
              className={`absolute flex -translate-x-1/2 flex-col items-center gap-1 transition-[left] duration-200 ease-linear ${runner.status === 'abandoned' || runner.status === 'summoned' ? 'opacity-40 grayscale' : ''}`}
              style={{
                left: `calc(${FINISH_ROOM / 2}px + ${runner.x} * (100% - ${FINISH_ROOM}px))`,
                bottom: runner.you ? 14 : 30 + runner.lane * LANE_STEP,
                zIndex: runner.you ? 30 : runner.leader ? 20 : 10 - runner.lane,
              }}
            >
              {runner.marks.some((mark) => MARK_ICONS[mark]) && (
                <span aria-hidden="true" data-testid="runner-marks" className="relative z-10 flex gap-0.5 text-tertiary">
                  {runner.marks.map((mark) => MARK_ICONS[mark] && <span key={mark} className="material-symbols-outlined text-[15px]!">{MARK_ICONS[mark]}</span>)}
                </span>
              )}
              <span className={`relative block ${runner.marks.includes('stunned') ? 'grayscale' : ''}`}>
                <span
                  aria-hidden="true"
                  className="relative z-10 block"
                  style={runner.seat.summon ? mahoragaStyle(runner.running) : spriteStyle(runner.character, runner.running ? 'running' : 'idle', runner.big ? SCALE.big : SCALE.small)}
                />
                <span aria-hidden="true" className={`absolute -bottom-[3px] left-1/2 h-2 w-11 -translate-x-1/2 rounded-[50%] ${runner.you ? 'bg-primary-container/55' : 'bg-black/60'}`} />
                {hits.filter((hit) => hit.target === runner.seat.id).map((hit, index) => {
                  const style = hitStyle(hit.ability);
                  // Plusieurs coups peuvent tomber dans le même tick, même deux fois la même technique.
                  return style && <span key={`${hit.at}:${index}`} aria-hidden="true" data-testid="runner-hit" className="absolute left-1/2 z-20 block -translate-x-1/2 motion-reduce:hidden" style={{ ...style, left: '50%', bottom: 0 }} />;
                })}
              </span>
              {/* Plaque du coureur (COURSE-05) : avatar, nom et MPM en direct, lisibles sans survol. */}
              <span
                aria-hidden="true"
                data-testid="runner-plate"
                className="font-label-code relative z-10 flex max-w-[132px] items-center gap-1.5 bg-black/60 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-on-surface"
              >
                <FramedAvatar player={{ username: name, avatar: runner.seat.avatar ?? runner.character, photo: runner.seat.photo ?? null }} size={16} frame={runner.you ? 'bg-primary-container' : 'bg-[#8f1022]'} />
                <span className="min-w-0 truncate">{name}</span>
                {runner.seat.kind === 'bot' && !runner.seat.summon && <BotBadge />}
                <span className="shrink-0 tabular-nums text-on-surface-variant">{t('wpm', { value: Math.round(runner.wpm) })}</span>
              </span>
              {runner.you && (
                <span aria-hidden="true" className="hx-cut font-label-code relative z-10 bg-primary-container px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-on-primary-container uppercase [--h:6px]">
                  {t('you')}
                </span>
              )}
            </div>
          );
        })}

        {/* Ligne d'arrivée, en damier blanc et cramoisi. */}
        <div
          aria-hidden="true"
          title={t('finish')}
          className="absolute top-4 bottom-6 -right-3.5 w-3 bg-[repeating-conic-gradient(#fffaf9_0_25%,#6e0718_0_50%)] bg-[length:12px_16px]"
        />
      </div>

      <ol aria-label={t('standings')} className="sr-only">
        {ranked.map((runner) => (
          <li key={runner.seat.id}>
            {t('row', {
              rank: runner.rank,
              name: nameOf(runner.seat),
              you: String(runner.you),
              percent: Math.round(runner.x * 100),
              wpm: runner.wpm,
              status: tStatus(runner.status),
            })}
          </li>
        ))}
      </ol>
    </BevelPanel>
  );
}
