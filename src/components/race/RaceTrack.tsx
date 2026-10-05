import { useTranslations } from 'next-intl';
import Avatar from '@/components/shared/Avatar';
import type { RacerSeat } from '@/game/race';
import type { TrackRunner } from './raceView';

const SIZE = { big: 52, small: 36 };
/** Décalage vertical entre deux rangs de la piste, en px. */
const LANE_STEP = 30;

// Course représentée graphiquement (maquette « Course ») : la zone d'animation en haut, puis la piste
// où chacun avance vers la ligne d'arrivée. Le meneur et le joueur sont plus gros (RACE-2, RACE-3).
export default function RaceTrack({ runners, banner, nameOf }: { runners: TrackRunner[]; banner: string; nameOf: (seat: RacerSeat) => string }) {
  const t = useTranslations('Race.track');
  const tStatus = useTranslations('Race.status');
  const ranked = [...runners].sort((a, b) => a.rank - b.rank);

  return (
    <section aria-label={t('label')} className="overflow-hidden rounded-[18px] border border-outline-variant bg-surface-container-lowest/85">
      {/* Zone d'animation : dépassements, meneur, plus tard les bonus (RACE-5). */}
      <div className="flex min-h-[68px] items-center justify-center border-b border-outline-variant px-4 py-3">
        <p key={banner} aria-live="polite" className="race-pop text-center text-[20px] tracking-[0.1em] text-on-surface uppercase">
          {banner}
        </p>
      </div>

      <div className="relative mx-4 h-[128px] sm:mx-6">
        {runners.map((runner) => {
          const size = runner.big ? SIZE.big : SIZE.small;
          const name = nameOf(runner.seat);
          const title = [name, runner.leader && t('leader'), runner.you && t('you')].filter(Boolean).join(' · ');
          return (
            <div
              key={runner.seat.id}
              title={title}
              className="absolute flex flex-col items-center transition-[left] duration-200 ease-linear"
              style={{
                left: `calc(${runner.x} * (100% - ${SIZE.big + 24}px))`,
                top: 8 + runner.lane * LANE_STEP + (runner.big ? 0 : (SIZE.big - SIZE.small) / 2),
                zIndex: runner.you ? 30 : runner.leader ? 20 : 10 - runner.lane,
              }}
            >
              {runner.leader && (
                <span aria-hidden="true" className="material-symbols-outlined absolute -top-[15px] text-[18px] text-gold">
                  crown
                </span>
              )}
              <RunnerAvatar runner={runner} name={name} size={size} />
              {runner.you && (
                <span aria-hidden="true" className="font-label-code relative z-10 -mt-1.5 bg-primary-container px-1 text-[10px] font-bold uppercase leading-[14px] text-on-primary-container">
                  {t('you')}
                </span>
              )}
            </div>
          );
        })}

        {/* Ligne d'arrivée, en damier. */}
        <div
          aria-hidden="true"
          title={t('finish')}
          className="absolute inset-y-2 right-2 w-3 bg-[repeating-conic-gradient(var(--color-on-surface)_0_25%,var(--color-surface-container-lowest)_0_50%)] bg-[length:6px_6px] opacity-80"
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
    </section>
  );
}

function RunnerAvatar({ runner, name, size }: { runner: TrackRunner; name: string; size: number }) {
  const ring = runner.you ? 'ring-2 ring-primary-container' : runner.leader ? 'ring-2 ring-gold' : 'ring-1 ring-outline-variant';
  const faded = runner.status === 'abandoned' ? 'opacity-40 grayscale' : '';

  if (runner.seat.kind === 'bot') {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-[50%] bg-secondary-container text-on-secondary-container ${ring} ${faded}`} style={{ width: size, height: size }}>
        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: Math.round(size * 0.55) }}>
          smart_toy
        </span>
      </span>
    );
  }
  return <Avatar avatar={runner.seat.avatar} name={name} size={size} className={`${ring} ${faded}`} />;
}
