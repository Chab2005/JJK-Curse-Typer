import { useTranslations } from 'next-intl';
import type { CharacterId } from '@/components/shared/characters';
import type { RacerStatus } from '@/game/race';
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
const HEADING: Record<Exclude<RacerStatus, 'racing' | 'stopped'>, 'finished' | 'abandoned' | 'timeout'> = {
  finished: 'finished',
  abandoned: 'abandoned',
  timeout: 'timeout',
};

const percent = (accuracy: number) => Math.round(accuracy * 100);

// Écran d'attente de qui a fini avant les autres (RACE-11), puis classement complet à la fin (RACE-14) :
// podium et tableau dans le style du classement général.
export default function RaceSummary({ rows, you, over, lobbyCode }: { rows: SummaryRow[]; you: string | null; over: boolean; lobbyCode: string }) {
  const t = useTranslations('Race.summary');
  const me = rows.find((row) => row.id === you);
  const racing = rows.filter((row) => row.status === 'racing').length;
  const heading = me && me.status !== 'racing' && me.status !== 'stopped' ? HEADING[me.status] : null;
  const waiting = !over && racing > 0;

  return (
    <div className="flex flex-col gap-8">
      {(heading || waiting) && (
        <section className="flex flex-col gap-6 border-l-[3px] border-primary-container bg-surface-container-low/80 px-6 py-6">
          {me && heading && (
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[26px] uppercase tracking-[0.12em] text-on-surface">{t(heading)}</h2>
              <p className="font-label-code text-[15px] text-primary">{t('position', { rank: me.rank, total: rows.length })}</p>
              <p className="font-label-code text-[15px] text-on-surface-variant">{t('stats', { wpm: me.wpm, accuracy: percent(me.accuracy) })}</p>
            </div>
          )}

          {waiting && (
            <p role="status" className="flex items-center gap-2 text-on-surface-variant">
              <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[18px] text-tertiary [animation-duration:2s]">progress_activity</span>
              {t('waiting', { count: racing })}
            </p>
          )}
        </section>
      )}

      {over && (
        <section aria-labelledby="race-results-title" className="flex flex-col gap-6">
          <h2 id="race-results-title" className="text-[22px] uppercase tracking-[0.12em] text-on-surface">
            {t('over')}
          </h2>
          <RacePodium rows={rows} />
          {rows.length > 3 && <RaceResultsTable rows={rows.slice(3)} />}
          <Link href={`/lobby/${lobbyCode}`} className="group flex min-h-10 items-center gap-2 self-start text-sm text-outline transition-colors hover:text-primary">
            <span aria-hidden="true" className="material-symbols-outlined text-[17px] text-primary">arrow_back</span>
            <span className="underline decoration-primary/40 underline-offset-4 group-hover:decoration-primary">{t('backToLobby')}</span>
          </Link>
        </section>
      )}
    </div>
  );
}
