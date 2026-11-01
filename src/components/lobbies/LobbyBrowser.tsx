'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import ChevronButton from '@/components/shared/ChevronButton';
import HexCard from '@/components/shared/HexCard';
import Pagination from '@/components/shared/Pagination';
import SearchField from '@/components/shared/SearchField';
import { writeSearch } from '@/components/shared/urlSearch';
import { paginate } from '@/lib/pagination';
import CreateLobbyButton from './CreateLobbyButton';
import LobbyFilters from './LobbyFilters';
import LobbyTable from './LobbyTable';
import { DEFAULT_LOBBY_FILTERS, type LobbyFilters as Filters, type LobbySummary, filterLobbies, lobbySearchQuery, parseLobbySearch } from './lobbySearch';

const PER_PAGE = 8;

// Recherche, filtres et pagination des lobbies publics ; l'état vit dans l'URL (?q=…&page=2).
// Le bouton de création s'aligne sur le compteur, ou passe sous « Effacer » quand rien ne correspond.
export default function LobbyBrowser({ lobbies, signedIn }: { lobbies: LobbySummary[]; signedIn: boolean }) {
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
      <div className="flex flex-wrap items-center gap-3.5">
        <SearchField id="lobby-search" label={t('search')} value={draft} onChange={search} />
        <LobbyFilters filters={current} onChange={applyFilters} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-label-code flex items-center gap-2.5 text-[12px] uppercase tracking-[0.16em] text-tertiary">
          <svg aria-hidden="true" viewBox="0 0 10 10" className="size-[7px] rotate-90">
            <path d="M5 0 10 10 5 7 0 10z" fill="currentColor" />
          </svg>
          {t('resultCount', { count: results.length })}
        </p>
        {results.length > 0 && <CreateLobbyButton signedIn={signedIn} />}
      </div>

      {results.length > 0 ? (
        <LobbyTable lobbies={view.items} />
      ) : (
        <HexCard className="flex flex-col items-center gap-[18px] px-8 py-11 text-center sm:px-16">
          <p className="text-[19px] text-on-surface-variant">{t('empty')}</p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <ChevronButton
              type="button"
              size="sm"
              onClick={() => {
                setDraft('');
                writeSearch(lobbySearchQuery(DEFAULT_LOBBY_FILTERS, 1), 'push');
              }}
              className="font-label-code text-[11px] uppercase tracking-[0.16em]"
            >
              {t('clear')}
            </ChevronButton>
            <CreateLobbyButton signedIn={signedIn} align="center" />
          </div>
        </HexCard>
      )}

      {view.pageCount > 1 && <Pagination label={t('pagination')} page={view.page} pageCount={view.pageCount} onChange={goToPage} />}
    </div>
  );
}
