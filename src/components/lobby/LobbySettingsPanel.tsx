'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { CHAR_KINDS, TEXT_LANGUAGES, textCharsLabel } from '@/components/lobbies/lobbySearch';
import BevelCheck from '@/components/shared/BevelCheck';
import BevelFrame, { cardFrame, goldFrame } from '@/components/shared/BevelFrame';
import BevelSelect from '@/components/shared/BevelSelect';
import Reserve from '@/components/shared/Reserve';
import Segmented from '@/components/shared/Segmented';
import { CONTENT_MODES, ERROR_MODES, LOBBY_VISIBILITIES, type LobbySettings, MAX_CAPACITY, MIN_PARTICIPANTS, TIMER_OPTIONS, WORDS_MAX, WORDS_MIN } from './lobbyRoom';

type Patch = Partial<LobbySettings>;

/** Ajoute ou retire `item` de la liste selon `checked`, dans l'ordre de `order`. */
const toggle = <T,>(order: readonly T[], list: readonly T[], item: T, checked: boolean): T[] => order.filter((x) => (x === item ? checked : list.includes(x)));

/** Champs de `next` qui diffèrent de `current`. */
const changes = (current: LobbySettings, next: LobbySettings): Patch =>
  Object.fromEntries(Object.entries(next).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(current[key as keyof LobbySettings])));

// Paramètres de course (LOB-5) et accès au lobby (LOB-1) : tout le monde voit le résumé des choix.
// L'hôte les modifie dans une fenêtre, et rien ne part avant « Enregistrer » ; le réducteur borne les valeurs.
export default function LobbySettingsPanel({ settings, participantCount, editable, onChange }: { settings: LobbySettings; participantCount: number; editable: boolean; onChange: (patch: Patch) => void }) {
  const t = useTranslations('Lobby.settings');

  return (
    <BevelFrame as="section" aria-labelledby="settings-title" frame={cardFrame} className="flex flex-col gap-5 bg-surface-container-low px-6 pt-6 pb-7">
      <div className="flex flex-col gap-1">
        <h2 id="settings-title" className="text-xl uppercase tracking-[0.12em]">{t('title')}</h2>
        {!editable && <p className="text-[14px] text-outline">{t('readOnly')}</p>}
      </div>
      <SettingsSummary settings={settings} />
      {editable && <SettingsDialog settings={settings} participantCount={participantCount} onSave={onChange} />}
    </BevelFrame>
  );
}

// <dialog> natif : focus piégé, Échap ou clic à côté pour annuler, retour du focus sur le bouton.
// La fenêtre ne bouge jamais : seul son corps défile (`overflow-clip` empêche le navigateur de faire défiler la fenêtre elle-même).
function SettingsDialog({ settings, participantCount, onSave }: { settings: LobbySettings; participantCount: number; onSave: (patch: Patch) => void }) {
  const t = useTranslations('Lobby.settings');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(settings);

  // Repart des réglages courants, en haut de la liste.
  const open = () => {
    setDraft(settings);
    dialogRef.current?.showModal();
    // Après showModal : une fenêtre fermée n'a pas de boîte, le défilement y est ignoré.
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  };
  const close = () => dialogRef.current?.close();

  // Pas de <form> : Entrée dans un champ numérique valide le champ, pas toute la fenêtre.
  const save = () => {
    const patch = changes(settings, draft);
    if (Object.keys(patch).length > 0) onSave(patch);
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="flex min-h-11 w-full items-center justify-center gap-2 border border-surface-container-highest px-4 text-[13px] uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary"
      >
        <span aria-hidden="true" className="material-symbols-outlined w-[18px] shrink-0 overflow-hidden text-[18px]!">edit</span>
        {t('edit')}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="settings-dialog-title"
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto w-[min(calc(100vw-32px),560px)] overflow-clip bg-transparent p-0 text-on-surface backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <BevelFrame frame={`flex max-h-[calc(100dvh-112px)] flex-col ${cardFrame}`} className="flex min-h-0 flex-col bg-surface-container-low">
          <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 sm:px-8">
            <h2 id="settings-dialog-title" className="text-[22px] uppercase tracking-[0.12em]">{t('title')}</h2>
            <button type="button" onClick={close} aria-label={t('close')} className="flex size-10 items-center justify-center text-on-surface-variant transition-colors hover:text-primary">
              <span aria-hidden="true" className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <div ref={bodyRef} className="min-h-0 overflow-y-auto px-6 pb-2 sm:px-8">
            <SettingsForm settings={draft} participantCount={participantCount} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-surface-container-highest px-6 pt-4 pb-6 sm:px-8">
            <button
              type="button"
              onClick={close}
              className="min-h-13 border border-surface-container-highest text-[15px] uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              {t('cancel')}
            </button>
            <BevelFrame as="button" type="button" onClick={save} frame={`group flex ${goldFrame}`} className="flex min-h-[50px] flex-1 items-center justify-center gap-2 bg-primary-container text-on-primary-container transition-colors group-hover:bg-inverse-primary text-[15px] uppercase tracking-[0.12em]">
              <span aria-hidden="true" className="material-symbols-outlined text-[19px]">save</span>
              {t('save')}
            </BevelFrame>
          </div>
        </BevelFrame>
      </dialog>
    </>
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
    [t('visibility'), t(`visibilities.${settings.visibility}`)],
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
        <div className="flex flex-wrap gap-2">
          {TEXT_LANGUAGES.map((language) => (
            <BevelCheck
              key={language}
              checked={settings.languages.includes(language)}
              // Le texte a toujours au moins une langue.
              disabled={settings.languages.length === 1 && settings.languages.includes(language)}
              onChange={(checked) => onChange({ languages: toggle(TEXT_LANGUAGES, settings.languages, language, checked) })}
            >
              {tFilters(`languages.${language}`)}
            </BevelCheck>
          ))}
        </div>
      </Group>

      <Group legend={t('content')}>
        <Segmented label={t('content')} options={CONTENT_MODES} value={settings.content} onChange={(content) => onChange({ content })} optionLabel={(mode) => t(`contents.${mode}`)} />
      </Group>

      <NumberField id="settings-words" label={t('words')} hint={t('wordsHint', { min: WORDS_MIN, max: WORDS_MAX })} value={settings.words} min={WORDS_MIN} max={WORDS_MAX} onCommit={(words) => onChange({ words })} />

      <Group legend={t('chars')}>
        <div className="flex flex-wrap gap-2">
          {CHAR_KINDS.map((kind) => (
            <BevelCheck key={kind} checked={settings.chars.includes(kind)} onChange={(checked) => onChange({ chars: toggle(CHAR_KINDS, settings.chars, kind, checked) })}>
              {tFilters(`charKinds.${kind}`)}
            </BevelCheck>
          ))}
        </div>
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
        <Label htmlFor="settings-timer" id="settings-timer-label">{t('timer')}</Label>
        <div className="self-start">
          <BevelSelect id="settings-timer" labelId="settings-timer-label" options={TIMER_OPTIONS as readonly number[]} value={settings.timer} onChange={(timer) => onChange({ timer })} optionLabel={timerLabel} />
        </div>
      </div>

      <Group legend={t('errorMode')}>
        <Segmented label={t('errorMode')} options={ERROR_MODES} value={settings.errorMode} onChange={(errorMode) => onChange({ errorMode })} optionLabel={(mode) => t(`errorModes.${mode}`)} />
        <Hints active={settings.errorMode} options={ERROR_MODES} hint={(mode) => t(`errorHints.${mode}`)} />
      </Group>

      <Group legend={t('bonus')}>
        <div className="flex">
          <BevelCheck checked={settings.bonus} onChange={(bonus) => onChange({ bonus })}>{t('bonusToggle')}</BevelCheck>
        </div>
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

      <Group legend={t('visibility')}>
        <Segmented label={t('visibility')} options={LOBBY_VISIBILITIES} value={settings.visibility} onChange={(visibility) => onChange({ visibility })} optionLabel={(v) => t(`visibilities.${v}`)} />
        <Hints active={settings.visibility} options={LOBBY_VISIBILITIES} hint={(v) => t(`visibilityHints.${v}`)} />
      </Group>
    </div>
  );
}

/** Aide de l'option choisie, à la hauteur de la plus longue : changer d'option ne décale pas la suite du formulaire. */
function Hints<T extends string>({ active, options, hint }: { active: T; options: readonly T[]; hint: (option: T) => string }) {
  const variants = Object.fromEntries(options.map((option) => [option, <p key={option} className="text-[13px] leading-5 text-outline">{hint(option)}</p>])) as Record<T, React.ReactNode>;
  return <Reserve active={active} variants={variants} className="mt-1" />;
}

function Label({ htmlFor, id, children }: { htmlFor: string; id?: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} id={id} className="font-label-code text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{children}</label>;
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-label-code mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{legend}</legend>
      {children}
    </fieldset>
  );
}

// Champ numérique validé à la sortie du champ ou sur Entrée, pour ne pas borner pendant la frappe.
// Les boutons − et + remplacent les flèches natives ; au clavier, ↑ et ↓ du champ font la même chose.
export function NumberField({ id, label, hint, value, min, max, onCommit }: { id: string; label: string; hint?: string; value: number; min: number; max: number; onCommit: (value: number) => void }) {
  const t = useTranslations('Lobby.settings');
  const [draft, setDraft] = useState(String(value));
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setDraft(String(value));
  }

  const commit = () => {
    const parsed = Number(draft);
    // Champ vide ou invalide : retour à la valeur courante. Sinon bornée tout de suite, pour montrer ce qui sera enregistré.
    const bounded = draft.trim() !== '' && Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : value;
    setDraft(String(bounded));
    if (bounded !== value) onCommit(bounded);
  };

  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <BevelFrame frame="flex self-start bg-primary-container transition-colors focus-within:bg-primary" className="flex min-h-11 bg-surface-container-lowest">
        <StepButton icon="remove" label={t('decrease', { field: label })} disabled={value <= min} onClick={() => step(-1)} />
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
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="font-label-code w-16 appearance-none bg-transparent text-center text-[16px] text-on-surface focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
        />
        <StepButton icon="add" label={t('increase', { field: label })} disabled={value >= max} onClick={() => step(1)} />
      </BevelFrame>
      {hint && <p id={`${id}-hint`} className="text-[13px] text-outline">{hint}</p>}
    </div>
  );
}

// Hors de l'ordre de tabulation, comme les flèches natives : le champ suffit au clavier.
function StepButton({ icon, label, disabled, onClick }: { icon: string; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid w-10 place-items-center text-primary transition-colors enabled:hover:bg-surface-container-high disabled:cursor-not-allowed disabled:text-outline-variant"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[18px]!">{icon}</span>
    </button>
  );
}
