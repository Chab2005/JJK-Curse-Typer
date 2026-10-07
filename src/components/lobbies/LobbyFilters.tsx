'use client';

import { useTranslations } from 'next-intl';
import BevelCheck from '@/components/shared/BevelCheck';
import FilterPopover from '@/components/shared/FilterPopover';
import { CHAR_KINDS, DEFAULT_LOBBY_FILTERS, type LobbyFilters as Filters, TEXT_LANGUAGES, activeFilterCount } from './lobbySearch';

/** Ajoute ou retire `item` de la liste selon `checked`. */
const toggle = <T,>(list: readonly T[], item: T, checked: boolean): T[] => (checked ? [...list, item] : list.filter((x) => x !== item));

// Menu des filtres de la recherche de lobbies : langue et caractères du texte, bonus.
export default function LobbyFilters({ filters, onChange }: { filters: Filters; onChange: (next: Filters) => void }) {
  const t = useTranslations('Lobbies.filters');

  return (
    <FilterPopover
      label={t('button')}
      badge={activeFilterCount(filters)}
      resetLabel={t('reset')}
      onReset={() => onChange({ ...DEFAULT_LOBBY_FILTERS, query: filters.query })}
      closeLabel={t('close')}
    >
      <div className="flex flex-col gap-5">
        <Group legend={t('language')}>
          <div className="flex gap-2">
            {TEXT_LANGUAGES.map((language) => (
              <BevelCheck
                key={language}
                checked={filters.languages.includes(language)}
                onChange={(checked) => onChange({ ...filters, languages: toggle(filters.languages, language, checked) })}
              >
                {t(`languages.${language}`)}
              </BevelCheck>
            ))}
          </div>
        </Group>

        <Group legend={t('chars')} hint={t('charsHint')}>
          {CHAR_KINDS.map((kind) => (
            <BevelCheck key={kind} checked={filters.chars.includes(kind)} onChange={(checked) => onChange({ ...filters, chars: toggle(filters.chars, kind, checked) })}>
              {t(`charKinds.${kind}`)}
            </BevelCheck>
          ))}
        </Group>

        <Group legend={t('bonus')}>
          <BevelCheck checked={filters.bonusOnly} onChange={(bonusOnly) => onChange({ ...filters, bonusOnly })}>
            {t('bonusOnly')}
          </BevelCheck>
        </Group>
      </div>
    </FilterPopover>
  );
}

function Group({ legend, hint, children }: { legend: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-label-code mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{legend}</legend>
      {hint && <p className="text-[13px] leading-5 text-outline">{hint}</p>}
      {children}
    </fieldset>
  );
}
