'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { CHAR_KINDS, TEXT_LANGUAGES, textCharsLabel } from '@/components/lobbies/lobbySearch';
import Segmented from '@/components/shared/Segmented';
import { CONTENT_MODES, ERROR_MODES, type LobbySettings, MAX_CAPACITY, MIN_PARTICIPANTS, TIMER_OPTIONS, WORDS_MAX, WORDS_MIN } from './lobbyRoom';

type Patch = Partial<LobbySettings>;

/** Ajoute ou retire `item` de la liste selon `checked`, dans l'ordre de `order`. */
const toggle = <T,>(order: readonly T[], list: readonly T[], item: T, checked: boolean): T[] => order.filter((x) => (x === item ? checked : list.includes(x)));

// Paramètres de course (LOB-5) : modifiables par l'hôte, en lecture seule pour les autres.
// Chaque changement part tout de suite ; le réducteur borne les valeurs.
export default function LobbySettingsPanel({ settings, participantCount, editable, onChange }: { settings: LobbySettings; participantCount: number; editable: boolean; onChange: (patch: Patch) => void }) {
  const t = useTranslations('Lobby.settings');

  return (
    <section aria-labelledby="settings-title" className="bevel bg-linear-160 from-primary-container via-outline-variant via-40% to-secondary-container p-px">
      <div className="bevel flex flex-col gap-5 bg-surface-container-low px-6 pt-6 pb-7">
        <div className="flex flex-col gap-1">
          <h2 id="settings-title" className="text-xl uppercase tracking-[0.12em]">{t('title')}</h2>
          {!editable && <p className="text-[14px] text-outline">{t('readOnly')}</p>}
        </div>
        {editable ? <SettingsForm settings={settings} participantCount={participantCount} onChange={onChange} /> : <SettingsSummary settings={settings} />}
      </div>
    </section>
  );
}

function useTimerLabel() {
  const t = useTranslations('Lobby.settings');
  const format = useFormatter();
  return (seconds: number) => (seconds === 0 ? t('timerOff') : format.number(seconds / 60, { style: 'unit', unit: 'minute', unitDisplay: 'short', maximumFractionDigits: 1 }));
}

function SettingsSummary({ settings }: { settings: LobbySettings }) {
  const t = useTranslations('Lobby.settings');
  const tFilters = useTranslations('Lobbies.filters');
  const timerLabel = useTimerLabel();

  const rows = [
    [t('language'), settings.languages.map((language) => tFilters(`languages.${language}`)).join(' · ')],
    [t('content'), t(`contents.${settings.content}`)],
    [t('words'), t('wordsValue', { count: settings.words })],
    [t('chars'), textCharsLabel(settings.chars)],
    [t('practice'), settings.practice || t('practiceNone')],
    [t('timer'), timerLabel(settings.timer)],
    [t('errorMode'), t(`errorModes.${settings.errorMode}`)],
    [t('bonus'), settings.bonus ? t('bonusOn') : t('bonusOff')],
    [t('capacity'), t('capacityValue', { count: settings.capacity })],
  ];

  return (
    <dl className="flex flex-col">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-primary/10 py-2.5 last:border-b-0">
          <dt className="text-[14px] text-on-surface-variant">{label}</dt>
          <dd className="font-label-code text-right text-[14px] text-on-surface">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SettingsForm({ settings, participantCount, onChange }: { settings: LobbySettings; participantCount: number; onChange: (patch: Patch) => void }) {
  const t = useTranslations('Lobby.settings');
  const tFilters = useTranslations('Lobbies.filters');
  const timerLabel = useTimerLabel();
  const minCapacity = Math.max(MIN_PARTICIPANTS, participantCount);

  return (
    <div className="flex flex-col gap-5">
      <Group legend={t('language')}>
        <div className="flex flex-wrap gap-x-5">
          {TEXT_LANGUAGES.map((language) => (
            <Check
              key={language}
              checked={settings.languages.includes(language)}
              onChange={(checked) => onChange({ languages: toggle(TEXT_LANGUAGES, settings.languages, language, checked) })}
            >
              {tFilters(`languages.${language}`)}
            </Check>
          ))}
        </div>
      </Group>

      <Group legend={t('content')}>
        <Segmented label={t('content')} options={CONTENT_MODES} value={settings.content} onChange={(content) => onChange({ content })} optionLabel={(mode) => t(`contents.${mode}`)} />
      </Group>

      <NumberField id="settings-words" label={t('words')} hint={t('wordsHint', { min: WORDS_MIN, max: WORDS_MAX })} value={settings.words} min={WORDS_MIN} max={WORDS_MAX} onCommit={(words) => onChange({ words })} />

      <Group legend={t('chars')}>
        {CHAR_KINDS.map((kind) => (
          <Check key={kind} checked={settings.chars.includes(kind)} onChange={(checked) => onChange({ chars: toggle(CHAR_KINDS, settings.chars, kind, checked) })}>
            {tFilters(`charKinds.${kind}`)}
          </Check>
        ))}
      </Group>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-practice">{t('practice')}</Label>
        <input
          id="settings-practice"
          value={settings.practice}
          onChange={(e) => onChange({ practice: e.target.value })}
          aria-describedby="settings-practice-hint"
          autoComplete="off"
          spellCheck={false}
          className="font-label-code min-h-11 w-full border border-surface-container-highest bg-surface-container-lowest px-3 text-[16px] tracking-[0.2em] text-on-surface focus:border-primary-container focus:outline-none"
        />
        <p id="settings-practice-hint" className="text-[13px] text-outline">{t('practiceHint')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-timer">{t('timer')}</Label>
        <select
          id="settings-timer"
          value={settings.timer}
          onChange={(e) => onChange({ timer: Number(e.target.value) })}
          className="font-label-code min-h-11 border border-surface-container-highest bg-surface-container-lowest px-3 text-[14px] text-on-surface focus:border-primary-container focus:outline-none"
        >
          {TIMER_OPTIONS.map((seconds) => (
            <option key={seconds} value={seconds}>{timerLabel(seconds)}</option>
          ))}
        </select>
      </div>

      <Group legend={t('errorMode')}>
        <Segmented label={t('errorMode')} options={ERROR_MODES} value={settings.errorMode} onChange={(errorMode) => onChange({ errorMode })} optionLabel={(mode) => t(`errorModes.${mode}`)} />
        <p className="mt-1 text-[13px] leading-5 text-outline">{t(`errorHints.${settings.errorMode}`)}</p>
      </Group>

      <Group legend={t('bonus')}>
        <Check checked={settings.bonus} onChange={(bonus) => onChange({ bonus })}>{t('bonusToggle')}</Check>
      </Group>

      <NumberField
        id="settings-capacity"
        label={t('capacity')}
        hint={t('capacityHint', { min: minCapacity, max: MAX_CAPACITY })}
        value={settings.capacity}
        min={minCapacity}
        max={MAX_CAPACITY}
        onCommit={(capacity) => onChange({ capacity })}
      />
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="font-label-code text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{children}</label>;
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-label-code mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{legend}</legend>
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

// Champ numérique validé à la sortie du champ ou sur Entrée, pour ne pas borner pendant la frappe.
function NumberField({ id, label, hint, value, min, max, onCommit }: { id: string; label: string; hint: string; value: number; min: number; max: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setDraft(String(value));
  }

  const commit = () => {
    const parsed = Number(draft);
    // Si la valeur bornée ne change pas, le champ revient à la valeur courante.
    setDraft(String(value));
    if (draft.trim() !== '' && Number.isFinite(parsed) && parsed !== value) onCommit(parsed);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        aria-describedby={`${id}-hint`}
        className="font-label-code min-h-11 w-32 border border-surface-container-highest bg-surface-container-lowest px-3 text-[16px] text-on-surface focus:border-primary-container focus:outline-none"
      />
      <p id={`${id}-hint`} className="text-[13px] text-outline">{hint}</p>
    </div>
  );
}
