'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import FilterPopover from '@/components/shared/FilterPopover';
import Pagination from '@/components/shared/Pagination';
import SearchField from '@/components/shared/SearchField';
import { writeSearch } from '@/components/shared/urlSearch';
import { paginate } from '@/lib/pagination';
import LeaderboardTable from './LeaderboardTable';
import Podium from './Podium';
import { CATEGORIES, type LeaderboardCategory, MIN_RANKED_GAMES, type PlayerStats, leaderboardQuery, leaderboardView, parseLeaderboardSearch, rankPlayers } from './leaderboard';

const PER_PAGE = 10;

// Recherche, catégorie de tri, podium et tableau du classement ; l'état vit dans l'URL (?by=accuracy&page=2).
export default function LeaderboardBrowser({ players }: { players: PlayerStats[] }) {
  const t = useTranslations('Leaderboard');
  const { category, query, page } = parseLeaderboardSearch(useSearchParams());

  // Même principe que la recherche de lobbies : le champ se recale sur l'URL quand elle change d'ailleurs.
  const [draft, setDraft] = useState(query);
  const [urlQuery, setUrlQuery] = useState(query);
  if (urlQuery !== query) {
    setUrlQuery(query);
    setDraft(query);
  }

  const ranked = rankPlayers(players, category);
  const { podium, rows } = leaderboardView(ranked, draft);
  const view = paginate(rows, page, PER_PAGE);

  const search = (next: string) => {
    setDraft(next);
    writeSearch(leaderboardQuery({ category, query: next }, 1), 'replace');
  };
  const sortBy = (next: LeaderboardCategory) => writeSearch(leaderboardQuery({ category: next, query: draft }, 1), 'push');
  const goToPage = (next: number) => writeSearch(leaderboardQuery({ category, query: draft }, next), 'push');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-stretch gap-3">
          <SearchField id="player-search" label={t('search')} value={draft} onChange={search} />
          <FilterPopover label={t('filter')} icon="filter_list" closeLabel={t('close')}>
            <fieldset className="flex flex-col gap-1">
              <legend className="font-label-code mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{t('sortBy')}</legend>
              {CATEGORIES.map((c) => (
                <label key={c} className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px] text-on-surface">
                  <input type="radio" name="leaderboard-category" checked={c === category} onChange={() => sortBy(c)} className="size-[18px] shrink-0 accent-primary-container" />
                  {t(`categories.${c}`)}
                </label>
              ))}
            </fieldset>
          </FilterPopover>
        </div>
        <p className="text-on-surface-variant">
          {t.rich('current', { category: t(`categories.${category}`), strong: (chunks) => <strong className="font-normal text-primary">{chunks}</strong> })}
        </p>
      </div>

      {podium.length > 0 && <Podium players={podium} category={category} />}

      {view.items.length > 0 ? (
        <LeaderboardTable players={view.items} category={category} />
      ) : (
        draft.trim() !== '' && <p className="border border-dashed border-outline-variant px-6 py-12 text-center text-lg text-on-surface-variant">{t('empty')}</p>
      )}

      {view.pageCount > 1 && <Pagination label={t('pagination')} page={view.page} pageCount={view.pageCount} onChange={goToPage} />}
      <p className="font-label-code text-center text-[12px] text-outline">{t('eligibility', { games: MIN_RANKED_GAMES })}</p>
    </div>
  );
}
