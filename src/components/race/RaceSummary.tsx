import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { CharacterId } from '@/components/shared/characters';
import type { RacerStatus } from '@/game/race';
import BevelPanel from '@/components/shared/BevelPanel';
import ChevronButton, { Chevrons } from '@/components/shared/ChevronButton';
import Pointer from '@/components/shared/Pointer';
import { Link } from '@/i18n/navigation';
import type { SeriesEntry } from '@/game/series';
import RaceMissedKeys from './RaceMissedKeys';
import RacePodium from './RacePodium';
import PersonalBestBadge from './PersonalBestBadge';
import RaceSeriesChart from './RaceSeriesChart';
import RaceResultsTable from './RaceResultsTable';

export interface SummaryRow {
  id: string;
  rank: number;
  name: string;
  avatar: CharacterId | null;
  /** Photo téléversée (PROF-5) ; prime sur `avatar`. */
  photo?: string | null;
  wpm: number;
  /** MPM brut, erreurs comprises (RES-02). */
  rawWpm: number;
  accuracy: number;
  errors: number;
  /** Temps de course en ms depuis le départ ; `null` tant que le coureur n'a pas fini. */
  endedAt: number | null;
  /** Effets de techniques reçus. */
  received: number;
  status: RacerStatus;
  you: boolean;
  /** Participant simulé (BOT-04) : repéré par une pastille. */
  bot?: boolean;
  /** Record personnel battu (RES-04), calculé par le serveur. */
  record?: boolean;
}

// Seuls les bots sont arrêtés (`stopped`) : un joueur n'a jamais cet en-tête.
const HEADING: Record<Exclude<RacerStatus, 'racing' | 'stopped'>, 'finished' | 'abandoned' | 'timeout' | 'summoned'> = {
  finished: 'finished',
  abandoned: 'abandoned',
  timeout: 'timeout',
  summoned: 'summoned',
};


// Écran d'attente de qui a fini avant les autres (RACE-11), puis classement complet à la fin (RACE-14) :
// panneau cramoisi, podium et tableau dans le style du classement général.
export default function RaceSummary({
  rows,
  you,
  over,
  lobbyCode,
  series = [],
  actions,
}: {
  rows: SummaryRow[];
  you: string | null;
  over: boolean;
  lobbyCode: string;
  /** MPM de chacun dans le temps et touches ratées, envoyés une fois la course finie (RES-03). */
  series?: SeriesEntry[];
  /** Suite de la course dans un salon créé (COURSE-11) : remplace le lien de retour au salon. */
  actions?: ReactNode;
}) {
  const t = useTranslations('Race.summary');
  const me = rows.find((row) => row.id === you);
  const racing = rows.filter((row) => row.status === 'racing').length;
  const heading = me && me.status !== 'racing' && me.status !== 'stopped' ? HEADING[me.status] : null;
  const waiting = !over && racing > 0;

  return (
    <div className="flex flex-col gap-8">
      {(heading || waiting) && (
        <BevelPanel as="section" className="flex flex-col gap-5 px-8 py-7 sm:px-10">
          {me && heading && (
            <div className="flex flex-col gap-2">
              <h2 className="text-[30px] uppercase tracking-[0.1em] text-on-primary-container">{t(heading)}</h2>
              <p className="font-label-code flex items-center gap-2.5 text-[13px] uppercase tracking-[0.16em] text-primary">
                <Pointer className="text-primary-text" />
                {t('position', { rank: me.rank, total: rows.length })}
                {/* Le record n'est connu qu'après l'enregistrement : sa place est gardée dès l'arrivée. */}
                {!me.bot && <PersonalBestBadge shown={me.record === true} className="ml-1" />}
              </p>
              <p className="font-label-code text-[15px] text-on-surface-variant">{t('stats', { wpm: me.wpm, accuracy: me.accuracy })}</p>
            </div>
          )}

          {waiting && (
            <p role="status" className="flex items-center gap-2 border-t border-[#8f1022]/60 pt-4 text-on-surface-variant">
              <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[18px] text-tertiary [animation-duration:2s]">progress_activity</span>
              {t('waiting', { count: racing })}
            </p>
          )}
        </BevelPanel>
      )}

      {over && (
        <section aria-labelledby="race-results-title" className="flex flex-col gap-6">
          <h2 id="race-results-title" className="flex items-center gap-3 text-[26px] uppercase tracking-[0.1em] text-on-primary-container">
            <span aria-hidden="true" className="flex h-[22px] w-3 -scale-x-100 text-primary-text">
              <Chevrons order="decreasing" className="size-full" />
            </span>
            {t('over')}
          </h2>
          <RacePodium rows={rows} />
          <RaceResultsTable rows={rows} />
          {actions ?? (
            <ChevronButton as={Link} href={`/lobby/${lobbyCode}`} variant="primary" frame="self-start" className="text-[15px] uppercase tracking-[0.12em]">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
              {t('backToLobby')}
            </ChevronButton>
          )}
          {/* Après le bouton : les séries arrivent après la fin de course et ne doivent rien déplacer de ce qui est déjà affiché. */}
          {series.length > 0 && (
            <>
              <RaceSeriesChart series={series} rows={rows} />
              <RaceMissedKeys series={series} rows={rows} you={you} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
