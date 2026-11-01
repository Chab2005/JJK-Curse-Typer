'use client';

import { useTranslations } from 'next-intl';
import FilterPopover from '@/components/shared/FilterPopover';
import PlateOption from '@/components/shared/PlateOption';
import { CHAR_KINDS, DEFAULT_LOBBY_FILTERS, type LobbyFilters as Filters, TEXT_LANGUAGES } from './lobbySearch';

/** Ajoute ou retire `item` de la liste selon `checked`. */
const toggle = <T,>(list: readonly T[], item: T, checked: boolean): T[] => (checked ? [...list, item] : list.filter((x) => x !== item));

// Menu des filtres de la recherche de lobbies : langue et caractères du texte, bonus.
export default function LobbyFilters({ filters, onChange }: { filters: Filters; onChange: (next: Filters) => void }) {
  const t = useTranslations('Lobbies.filters');

  return (
    <FilterPopover
      label={t('button')}
      resetLabel={t('reset')}
      onReset={() => onChange({ ...DEFAULT_LOBBY_FILTERS, query: filters.query })}
      closeLabel={t('close')}
    >
      <div className="flex flex-col gap-5">
        <Group legend={t('language')}>
          <div className="flex gap-1.5">
            {TEXT_LANGUAGES.map((language) => (
              <PlateOption
                key={language}
                checked={filters.languages.includes(language)}
                onChange={(checked) => onChange({ ...filters, languages: toggle(filters.languages, language, checked) })}
              >
                {t(`languages.${language}`)}
              </PlateOption>
            ))}
          </div>
        </Group>

        <Group legend={t('chars')} hint={t('charsHint')}>
          {CHAR_KINDS.map((kind) => (
            <PlateOption key={kind} checked={filters.chars.includes(kind)} onChange={(checked) => onChange({ ...filters, chars: toggle(filters.chars, kind, checked) })}>
              {t(`charKinds.${kind}`)}
            </PlateOption>
          ))}
        </Group>

        <Group legend={t('bonus')}>
          <PlateOption checked={filters.bonusOnly} onChange={(bonusOnly) => onChange({ ...filters, bonusOnly })}>
            {t('bonusOnly')}
          </PlateOption>
        </Group>
      </div>
    </FilterPopover>
  );
}

function Group({ legend, hint, children }: { legend: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="font-label-code mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-container">{legend}</legend>
      {hint && <p className="mb-1 text-[13px] leading-5 text-outline">{hint}</p>}
      {children}
    </fieldset>
  );
}
