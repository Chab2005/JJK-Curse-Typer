'use client';

import { useFormatter, useTranslations } from 'next-intl';
import ChevronButton from '@/components/shared/ChevronButton';
import Pagination from '@/components/shared/Pagination';
import type { RacerStatus } from '@/game/race';
import { Link, useRouter } from '@/i18n/navigation';

/** Une course de l'historique, telle que la page la lit (`src/lib/history.ts`). */
export interface HistoryItem {
  id: number;
  at: string;
  rank: number | null;
  players: number | null;
  wpm: number;
  /** En pourcentage, de 0 à 100. */
  accuracy: number;
  status: string | null;
}

const STATUSES: readonly RacerStatus[] = ['racing', 'finished', 'abandoned', 'timeout', 'stopped', 'summoned'];

/** Colonnes partagées par l'en-tête et les rangées : date, rang et MPM sur téléphone ; le détail apparaît avec la largeur. */
const COLUMNS = 'grid grid-cols-[minmax(0,1fr)_56px_auto] items-center gap-x-3 md:grid-cols-[minmax(0,1fr)_64px_96px_96px_120px] lg:grid-cols-[minmax(0,1fr)_64px_96px_96px_120px_120px]';

// Historique des courses du compte connecté (HIST-01) : un vrai tableau, une rangée par course, la plus récente d'abord.
// La date mène à la page de résultats de la course (HIST-02). Pages numérotées dans l'URL (`?page=`), lues en base.
export default function RaceHistoryList({ items, page, pageCount }: { items: HistoryItem[]; page: number; pageCount: number }) {
  const t = useTranslations('History');
  const tStatus = useTranslations('Race.status');
  const format = useFormatter();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5">
        <p className="text-lg text-on-surface-variant">{t('empty')}</p>
        <ChevronButton as={Link} href="/lobbies" variant="primary" className="text-[15px] uppercase tracking-[0.12em]">
          {t('emptyCta')}
        </ChevronButton>
      </div>
    );
  }

  const detail = 'font-label-code hidden text-right whitespace-nowrap text-on-surface-variant';
  const status = (value: string | null) => tStatus(STATUSES.includes(value as RacerStatus) ? (value as RacerStatus) : 'finished');

  return (
    <div className="flex flex-col gap-8">
      <table role="table" className="block w-full text-left">
        <caption className="sr-only">{t('caption')}</caption>
        <thead role="rowgroup" className="font-label-code block text-[11px] uppercase tracking-[0.16em] text-outline">
          <tr role="row" className={`${COLUMNS} px-[34px] pb-1.5`}>
            <th role="columnheader" scope="col" className="font-medium">{t('date')}</th>
            <th role="columnheader" scope="col" className="text-right font-medium">{t('rank')}</th>
            <th role="columnheader" scope="col" className="text-right font-medium text-primary">{t('wpm')}</th>
            <th role="columnheader" scope="col" className="hidden text-right font-medium md:block">{t('accuracy')}</th>
            <th role="columnheader" scope="col" className="hidden text-right font-medium md:block">{t('players')}</th>
            <th role="columnheader" scope="col" className="hidden text-right font-medium lg:block">{t('status')}</th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="flex flex-col gap-1.5">
          {items.map((item) => {
            const date = format.dateTime(new Date(item.at), { dateStyle: 'medium', timeStyle: 'short' });
            return (
              <tr role="row" key={item.id} className={`hx-row ${COLUMNS} min-h-14 px-[34px] [--h:18px]`}>
                <td role="cell" className="min-w-0">
                  <Link href={`/history/${item.id}`} aria-label={t('open', { date })} className="font-grotesk block truncate text-[17px] text-on-primary-container underline-offset-4 hover:underline">
                    {date}
                  </Link>
                </td>
                <td role="cell" className="font-label-code text-right text-[14px] text-outline">{item.rank === null ? t('unknown') : t('rankValue', { rank: item.rank })}</td>
                <td role="cell" className="font-label-code text-right text-[15px] font-bold whitespace-nowrap text-on-surface">{t('wpmValue', { value: Math.round(item.wpm) })}</td>
                <td role="cell" className={`${detail} text-[14px] md:block`}>{format.number(item.accuracy / 100, { style: 'percent', maximumFractionDigits: 1 })}</td>
                <td role="cell" className={`${detail} text-[14px] md:block`}>{item.players === null ? t('unknown') : t('playersValue', { count: item.players })}</td>
                <td role="cell" className={`${detail} text-[13px] lg:block`}>{status(item.status)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pageCount > 1 && <Pagination label={t('pagination')} page={page} pageCount={pageCount} onChange={(next) => router.push(`/history?page=${next}`)} />}
    </div>
  );
}
