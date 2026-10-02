'use client';

import { useTranslations } from 'next-intl';
import FilterPopover from '@/components/shared/FilterPopover';
import { CHAR_KINDS, DEFAULT_LOBBY_FILTERS, type LobbyFilters as Filters, TEXT_LANGUAGES, activeFilterCount } from './lobbySearch';

/** Ajoute ou retire `item` de la liste selon `checked`. */
const toggle = <T,>(list: readonly T[], item: T, checked: boolean): T[] => (checked ? [...list, item] : list.filter((x) => x !== item));

// Menu des filtres de la recherche de lobbies : disponibilité, bonus, langue et caractères du texte.
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
        <Group legend={t('availability')}>
          <Check checked={filters.showUnavailable} onChange={(showUnavailable) => onChange({ ...filters, showUnavailable })}>
            {t('showUnavailable')}
          </Check>
          <Check checked={filters.bonusOnly} onChange={(bonusOnly) => onChange({ ...filters, bonusOnly })}>
            {t('bonusOnly')}
          </Check>
        </Group>

        <Group legend={t('language')}>
          <div className="flex flex-wrap gap-x-5">
            {TEXT_LANGUAGES.map((language) => (
              <Check
                key={language}
                checked={filters.languages.includes(language)}
                onChange={(checked) => onChange({ ...filters, languages: toggle(filters.languages, language, checked) })}
              >
                {t(`languages.${language}`)}
              </Check>
            ))}
          </div>
        </Group>

        <Group legend={t('chars')} hint={t('charsHint')}>
          {CHAR_KINDS.map((kind) => (
            <Check key={kind} checked={filters.chars.includes(kind)} onChange={(checked) => onChange({ ...filters, chars: toggle(filters.chars, kind, checked) })}>
              {t(`charKinds.${kind}`)}
            </Check>
          ))}
        </Group>
      </div>
    </FilterPopover>
  );
}

function Group({ legend, hint, children }: { legend: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-label-code mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{legend}</legend>
      {hint && <p className="mb-1 text-[13px] leading-5 text-outline">{hint}</p>}
      {children}
    </fieldset>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px] text-on-surface">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-[18px] shrink-0 accent-primary-container" />
      {children}
    </label>
  );
}
