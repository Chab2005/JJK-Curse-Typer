import { useTranslations } from 'next-intl';
import type { RacerStatus } from '@/game/race';
import { Link } from '@/i18n/navigation';

export interface SummaryRow {
  id: string;
  rank: number;
  name: string;
  wpm: number;
  accuracy: number;
  status: RacerStatus;
  you: boolean;
}

const HEADING: Record<Exclude<RacerStatus, 'racing'>, 'finished' | 'abandoned' | 'timeout'> = {
  finished: 'finished',
  abandoned: 'abandoned',
  timeout: 'timeout',
};

const percent = (accuracy: number) => Math.round(accuracy * 100);

// Écran d'attente de qui a fini avant les autres (RACE-11), puis classement complet à la fin (RACE-14).
// Le podium détaillé viendra avec la maquette « Fin de course ».
export default function RaceSummary({ rows, you, over, lobbyCode }: { rows: SummaryRow[]; you: string | null; over: boolean; lobbyCode: string }) {
  const t = useTranslations('Race.summary');
  const tStatus = useTranslations('Race.status');
  const me = rows.find((row) => row.id === you);
  const racing = rows.filter((row) => row.status === 'racing').length;

  return (
    <section className="flex flex-col gap-6 border-l-[3px] border-primary-container bg-surface-container-low/80 px-6 py-6">
      {me && me.status !== 'racing' && (
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[26px] uppercase tracking-[0.12em] text-on-surface">{t(HEADING[me.status])}</h2>
          <p className="font-label-code text-[15px] text-primary">{t('position', { rank: me.rank, total: rows.length })}</p>
          <p className="font-label-code text-[15px] text-on-surface-variant">{t('stats', { wpm: me.wpm, accuracy: percent(me.accuracy) })}</p>
        </div>
      )}

      {!over && racing > 0 && (
        <p role="status" className="flex items-center gap-2 text-on-surface-variant">
          <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[18px] text-tertiary [animation-duration:2s]">progress_activity</span>
          {t('waiting', { count: racing })}
        </p>
      )}

      {over && (
        <>
          <h2 className="text-[22px] uppercase tracking-[0.12em] text-on-surface">{t('over')}</h2>
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{t('results')}</caption>
            <thead>
              <tr className="font-label-code text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                <th scope="col" className="py-2 pr-3 font-normal">{t('rank')}</th>
                <th scope="col" className="py-2 pr-3 font-normal">{t('name')}</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">{t('wpm')}</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">{t('accuracy')}</th>
                <th scope="col" className="py-2 font-normal">{t('state')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-t border-outline-variant/60 ${row.you ? 'bg-primary-container/15' : ''}`}>
                  <td className="font-label-code py-2.5 pr-3 tabular-nums">{row.rank}</td>
                  <td className="py-2.5 pr-3">
                    {row.name} {row.you && <span className="font-label-code text-[12px] text-primary">{t('you')}</span>}
                  </td>
                  <td className="font-label-code py-2.5 pr-3 text-right tabular-nums">{row.wpm}</td>
                  <td className="font-label-code py-2.5 pr-3 text-right tabular-nums">{percent(row.accuracy)}%</td>
                  <td className="font-label-code py-2.5 text-[13px] text-on-surface-variant">{tStatus(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link href={`/lobby/${lobbyCode}`} className="group flex min-h-10 items-center gap-2 self-start text-sm text-outline transition-colors hover:text-primary">
            <span aria-hidden="true" className="material-symbols-outlined text-[17px] text-primary">arrow_back</span>
            <span className="underline decoration-primary/40 underline-offset-4 group-hover:decoration-primary">{t('backToLobby')}</span>
          </Link>
        </>
      )}
    </section>
  );
}
