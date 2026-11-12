'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import BevelCheck from '@/components/shared/BevelCheck';
import BevelPanel from '@/components/shared/BevelPanel';
import Segmented from '@/components/shared/Segmented';
import { type HeatKey, type HeatmapMode, type KeyStat, type KeyTone, heatmap, weakestKeys } from './keyboard';

// Trois tons de luminosités différentes (vert sombre, cramoisi, or clair), chacun avec son encre (contraste AA).
const TONES: Record<KeyTone, string> = {
  weak: 'bg-primary-container text-on-primary-container',
  average: 'bg-gold text-[#2a1a00]',
  strong: 'bg-[#2f7d55] text-[#eafff2]',
};
/** Décalage de chaque rangée, en largeurs de touche, comme sur un vrai clavier. */
const INDENTS = [0, 0.5, 0.75, 1.25, 3];
const MODES = ['errors', 'speed'] as const;

// Carte de chaleur du clavier (STAT-3) : chaque touche affiche sa valeur, la couleur la situe par rapport au joueur (UI-8).
export default function KeyboardHeatmap({ stats, modes = MODES, title, headerExtra }: { stats: KeyStat[]; /** Valeurs proposées : les deux par défaut. */ modes?: readonly HeatmapMode[]; /** Titre de la carte, « Carte de chaleur du clavier » par défaut. */ title?: string; /** Contrôle ajouté à côté du titre (choix du joueur, dans les résultats d'une course). */ headerExtra?: React.ReactNode }) {
  const t = useTranslations('Profile.heatmap');
  const format = useFormatter();
  const [mode, setMode] = useState<HeatmapMode>(modes[0]);
  const [shift, setShift] = useState(false);

  const rows = heatmap(stats, mode, shift);
  const weakest = weakestKeys(rows, 4);
  const value = (key: HeatKey) =>
    key.value === null ? '—' : mode === 'errors' ? format.number(key.value, { style: 'percent', maximumFractionDigits: key.value < 0.1 ? 1 : 0 }) : t('ms', { value: Math.round(key.value) });
  const keyName = (key: HeatKey) => (key.char === ' ' ? t('space') : key.char);
  const describe = (key: HeatKey) => (key.tone ? t('keyLabel', { key: keyName(key), value: value(key), tone: t(`tones.${key.tone}`) }) : t('keyUnused', { key: keyName(key) }));

  return (
    <BevelPanel as="section" aria-labelledby="heatmap-title" className="flex flex-col gap-5 px-5 pt-6 pb-7 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="heatmap-title" className="flex items-center gap-2.5 text-[20px] uppercase tracking-[0.1em] text-on-surface">
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary-text">keyboard</span>
          {title ?? t('title')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {headerExtra}
          {modes.length > 1 && <Segmented label={t('mode')} options={modes} value={mode} onChange={setMode} optionLabel={(m) => t(`modes.${m}`)} />}
          <BevelCheck checked={shift} onChange={setShift}>
            <span className="font-label-code text-[12px] uppercase">{t('shift')}</span>
          </BevelCheck>
        </div>
      </div>

      <ul aria-label={t('legend')} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-on-surface-variant">
        {(['weak', 'average', 'strong'] as const).map((tone) => (
          <li key={tone} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-2.5 rotate-45 ${TONES[tone]}`} />
            {t(`tones.${tone}`)}
          </li>
        ))}
        <li className="font-label-code text-[12px] text-outline">{t(`valueHint.${mode}`)}</li>
      </ul>

      {/* Le clavier garde ses proportions : sur téléphone, il défile à l'horizontale. */}
      <div className="-mx-1 overflow-x-auto px-1 pb-2 [--u:2.6rem] sm:[--u:2.85rem]">
        <div className="flex w-max flex-col gap-1.5">
          {rows.map((row, r) => (
            <ul key={r} aria-label={t('row', { number: r + 1 })} className="flex gap-1.5" style={{ paddingLeft: `calc(var(--u) * ${INDENTS[r]})` }}>
              {row.map((key) => (
                <li
                  key={key.label}
                  title={describe(key)}
                  aria-label={describe(key)}
                  className={`bevel-var flex h-(--u) flex-col items-center justify-center gap-0.5 [--b:6px] ${key.tone ? TONES[key.tone] : 'bg-[#241417] text-outline'}`}
                  style={{ width: `calc(var(--u) * ${key.width ?? 1} + ${((key.width ?? 1) - 1) * 6}px)` }}
                >
                  <span aria-hidden="true" className="font-label-code text-[15px] leading-none font-bold">{keyName(key)}</span>
                  <span aria-hidden="true" className="font-label-code text-[9.5px] leading-none">{value(key)}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {weakest.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 border-t border-[#8f1022]/60 pt-[18px]">
          <p className="font-label-code mr-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-text">{t('weakest')}</p>
          <ul className="flex flex-wrap gap-2">
            {weakest.map((key) => (
              <li key={key.label} className="hx-cut flex bg-primary-container p-px [--h:10px]">
                <span className="hx-cut font-label-code flex min-h-[30px] items-center bg-linear-to-b from-[#3a0c14] to-[#170608] px-5 text-[13px] text-primary-fixed [--h:9.5px]">
                  {keyName(key)} · {value(key)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </BevelPanel>
  );
}
