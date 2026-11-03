import { useTranslations } from 'next-intl';
import type { CharacterId } from '@/components/shared/characters';
import type { RacerStatus } from '@/game/race';
import BevelPanel from '@/components/shared/BevelPanel';
import ChevronButton, { Chevrons } from '@/components/shared/ChevronButton';
import Pointer from '@/components/shared/Pointer';
import { Link } from '@/i18n/navigation';
import RacePodium from './RacePodium';
import RaceResultsTable from './RaceResultsTable';

export interface SummaryRow {
  id: string;
  rank: number;
  name: string;
  avatar: CharacterId | null;
  /** Photo téléversée (PROF-5) ; prime sur `avatar`. */
  photo?: string | null;
  wpm: number;
  accuracy: number;
  status: RacerStatus;
  you: boolean;
}

// Seuls les bots sont arrêtés (`stopped`) : un joueur n'a jamais cet en-tête.
const HEADING: Record<Exclude<RacerStatus, 'racing' | 'stopped'>, 'finished' | 'abandoned' | 'timeout' | 'summoned'> = {
  finished: 'finished',
  abandoned: 'abandoned',
  timeout: 'timeout',
  summoned: 'summoned',
};

const percent = (accuracy: number) => Math.round(accuracy * 100);

// Écran d'attente de qui a fini avant les autres (RACE-11), puis classement complet à la fin (RACE-14) :
// panneau cramoisi, podium et tableau dans le style du classement général.
export default function RaceSummary({ rows, you, over, lobbyCode }: { rows: SummaryRow[]; you: string | null; over: boolean; lobbyCode: string }) {
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
                <Pointer className="text-primary-container" />
                {t('position', { rank: me.rank, total: rows.length })}
              </p>
              <p className="font-label-code text-[15px] text-on-surface-variant">{t('stats', { wpm: me.wpm, accuracy: percent(me.accuracy) })}</p>
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
            <span aria-hidden="true" className="flex h-[22px] w-3 -scale-x-100 text-primary-container">
              <Chevrons order="decreasing" className="size-full" />
            </span>
            {t('over')}
          </h2>
          <RacePodium rows={rows} />
          {rows.length > 3 && <RaceResultsTable rows={rows.slice(3)} />}
          <ChevronButton as={Link} href={`/lobby/${lobbyCode}`} variant="primary" frame="self-start" className="text-[15px] uppercase tracking-[0.12em]">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('backToLobby')}
          </ChevronButton>
        </section>
      )}
    </div>
  );
}
