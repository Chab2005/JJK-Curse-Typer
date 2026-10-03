'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Pagination from '@/components/shared/Pagination';
import SearchField from '@/components/shared/SearchField';
import { writeSearch } from '@/components/shared/urlSearch';
import { paginate } from '@/lib/pagination';
import LobbyFilters from './LobbyFilters';
import LobbyTable from './LobbyTable';
import { DEFAULT_LOBBY_FILTERS, type LobbyFilters as Filters, type LobbySummary, filterLobbies, lobbySearchQuery, parseLobbySearch } from './lobbySearch';

const PER_PAGE = 8;

// Recherche, filtres et pagination des lobbies publics ; l'état vit dans l'URL (?q=…&page=2).
export default function LobbyBrowser({ lobbies }: { lobbies: LobbySummary[] }) {
  const t = useTranslations('Lobbies');
  const { filters, page } = parseLobbySearch(useSearchParams());

  // Le champ garde sa propre valeur pour ne pas sauter pendant la frappe ;
  // il se recale sur l'URL quand elle change d'ailleurs (bouton Retour).
  const [draft, setDraft] = useState(filters.query);
  const [urlQuery, setUrlQuery] = useState(filters.query);
  if (urlQuery !== filters.query) {
    setUrlQuery(filters.query);
    setDraft(filters.query);
  }

  const current = { ...filters, query: draft };
  const results = filterLobbies(lobbies, current);
  const view = paginate(results, page, PER_PAGE);

  const search = (query: string) => {
    setDraft(query);
    writeSearch(lobbySearchQuery({ ...current, query }, 1), 'replace');
  };
  const applyFilters = (next: Filters) => writeSearch(lobbySearchQuery(next, 1), 'push');
  const goToPage = (next: number) => writeSearch(lobbySearchQuery(current, next), 'push');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-stretch gap-3">
        <SearchField id="lobby-search" label={t('search')} value={draft} onChange={search} />
        <LobbyFilters filters={current} onChange={applyFilters} />
      </div>

      <p aria-live="polite" className="font-label-code text-[12px] uppercase tracking-[0.16em] text-tertiary">
        {t('resultCount', { count: results.length })}
      </p>

      {results.length > 0 ? (
        <LobbyTable lobbies={view.items} />
      ) : (
        <div className="flex flex-col items-center gap-4 border border-dashed border-outline-variant px-6 py-14 text-center">
          <p className="text-lg text-on-surface-variant">{t('empty')}</p>
          <button
            type="button"
            onClick={() => {
              setDraft('');
              writeSearch(lobbySearchQuery(DEFAULT_LOBBY_FILTERS, 1), 'push');
            }}
            className="min-h-11 border border-on-surface px-5 text-[13px] uppercase tracking-[0.14em] transition-colors hover:bg-on-surface hover:text-surface-container-lowest"
          >
            {t('clear')}
          </button>
        </div>
      )}

      {view.pageCount > 1 && <Pagination label={t('pagination')} page={view.page} pageCount={view.pageCount} onChange={goToPage} />}
    </div>
  );
}
