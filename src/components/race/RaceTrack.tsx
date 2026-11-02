import { useTranslations } from 'next-intl';
import { spriteStyle } from '@/components/characters/characterSprites';
import BevelPanel from '@/components/shared/BevelPanel';
import { Chevrons } from '@/components/shared/ChevronButton';
import type { RacerSeat } from '@/game/race';
import type { TrackRunner } from './raceView';

/** Taille des personnages, en fraction du fichier : le meneur et le joueur sont plus gros (RACE-2, RACE-3). */
const SCALE = { big: 0.27, small: 0.2 };
/** Écart vertical entre deux rangs de la piste, en px. */
const LANE_STEP = 24;
/** Place réservée à droite pour que le personnage arrivé reste avant la ligne. */
const FINISH_ROOM = 88;

// Course représentée graphiquement (canvas « Course · style cramoisi ») : la zone d'animation en haut, puis la piste
// où chacun avance vers la ligne d'arrivée, dessiné en personnage : il court quand il avance, il est au repos sinon.
export default function RaceTrack({ runners, banner, nameOf }: { runners: TrackRunner[]; banner: string; nameOf: (seat: RacerSeat) => string }) {
  const t = useTranslations('Race.track');
  const tStatus = useTranslations('Race.status');
  const ranked = [...runners].sort((a, b) => a.rank - b.rank);

  return (
    <BevelPanel as="section" aria-label={t('label')}>
      {/* Zone d'animation : dépassements, meneur, plus tard les bonus (RACE-5). */}
      <div className="flex min-h-[58px] items-center justify-center gap-3 border-b border-[#8f1022]/70 px-6 py-3">
        <span aria-hidden="true" className="flex h-5 w-2.5 shrink-0 text-primary-container">
          <Chevrons order="decreasing" className="size-full -scale-x-100" />
        </span>
        <p key={banner} aria-live="polite" className="race-pop text-center text-[20px] tracking-[0.12em] text-on-primary-container uppercase">
          {banner}
        </p>
        <span aria-hidden="true" className="flex h-5 w-2.5 shrink-0 text-primary-container">
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
              className={`absolute flex -translate-x-1/2 flex-col items-center gap-1 transition-[left] duration-200 ease-linear ${runner.status === 'abandoned' ? 'opacity-40 grayscale' : ''}`}
              style={{
                left: `calc(${FINISH_ROOM / 2}px + ${runner.x} * (100% - ${FINISH_ROOM}px))`,
                bottom: runner.you ? 14 : 30 + runner.lane * LANE_STEP,
                zIndex: runner.you ? 30 : runner.leader ? 20 : 10 - runner.lane,
              }}
            >
              <span className="relative block">
                <span
                  aria-hidden="true"
                  className="relative z-10 block"
                  style={spriteStyle(runner.character, runner.running ? 'running' : 'idle', runner.big ? SCALE.big : SCALE.small)}
                />
                <span aria-hidden="true" className={`absolute -bottom-[3px] left-1/2 h-2 w-11 -translate-x-1/2 rounded-[50%] ${runner.you ? 'bg-primary-container/55' : 'bg-black/60'}`} />
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
