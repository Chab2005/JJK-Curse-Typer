'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import Segmented from '@/components/shared/Segmented';
import { type HeatKey, type HeatmapMode, type KeyStat, type KeyTone, LAYOUTS, type LayoutName, heatmap, weakestKeys } from './keyboard';

// Couleurs validées pour le daltonisme sur fond sombre ; encre foncée sur les trois (contraste AA).
const TONES: Record<KeyTone, string> = { weak: 'bg-[#d4364b]', average: 'bg-[#c9a23a]', strong: 'bg-[#3f9a63]' };
/** Décalage de chaque rangée, en largeurs de touche, comme sur un vrai clavier. */
const INDENTS: Record<LayoutName, number[]> = { qwerty: [0, 0.5, 0.75, 1.25, 3], azerty: [0, 0.5, 0.75, 0.25, 3] };
const MODES = ['errors', 'speed'] as const;
const LAYOUT_NAMES = Object.keys(LAYOUTS) as LayoutName[];

// Carte de chaleur du clavier (STAT-3) : chaque touche affiche sa valeur, la couleur la situe par rapport au joueur (UI-8).
export default function KeyboardHeatmap({ stats }: { stats: KeyStat[] }) {
  const t = useTranslations('Profile.heatmap');
  const format = useFormatter();
  const [mode, setMode] = useState<HeatmapMode>('errors');
  const [layout, setLayout] = useState<LayoutName>('qwerty');

  const rows = heatmap(LAYOUTS[layout], stats, mode);
  const weakest = weakestKeys(rows, 4);
  const value = (key: HeatKey) =>
    key.value === null ? '—' : mode === 'errors' ? format.number(key.value, { style: 'percent', maximumFractionDigits: key.value < 0.1 ? 1 : 0 }) : t('ms', { value: Math.round(key.value) });
  const keyName = (key: HeatKey) => (key.label === '␣' ? t('space') : key.label.toUpperCase());
  const describe = (key: HeatKey) => (key.tone ? t('keyLabel', { key: keyName(key), value: value(key), tone: t(`tones.${key.tone}`) }) : t('keyUnused', { key: keyName(key) }));

  return (
    <section aria-labelledby="heatmap-title" className="bevel flex flex-col gap-5 bg-surface-container-low px-5 py-6 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="heatmap-title" className="flex items-center gap-2 text-[15px] uppercase tracking-[0.14em] text-on-surface-variant">
          <span aria-hidden="true" className="material-symbols-outlined text-lg text-primary">keyboard</span>
          {t('title')}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Segmented label={t('mode')} options={MODES} value={mode} onChange={setMode} optionLabel={(m) => t(`modes.${m}`)} />
          <Segmented label={t('layout')} options={LAYOUT_NAMES} value={layout} onChange={setLayout} optionLabel={(l) => l} />
        </div>
      </div>

      <ul aria-label={t('legend')} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-on-surface-variant">
        {(['weak', 'average', 'strong'] as const).map((tone) => (
          <li key={tone} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-3.5 ${TONES[tone]}`} />
            {t(`tones.${tone}`)}
          </li>
        ))}
        <li className="font-label-code text-[12px] text-outline">{t(`valueHint.${mode}`)}</li>
      </ul>

      {/* Le clavier garde ses proportions : sur téléphone, il défile à l'horizontale. */}
      <div className="-mx-1 overflow-x-auto px-1 pb-2 [--u:2.6rem] sm:[--u:2.85rem]">
        <div className="flex w-max flex-col gap-1.5">
          {rows.map((row, r) => (
            <ul key={r} aria-label={t('row', { number: r + 1 })} className="flex gap-1.5" style={{ paddingLeft: `calc(var(--u) * ${INDENTS[layout][r]})` }}>
              {row.map((key) => (
                <li
                  key={key.label}
                  title={describe(key)}
                  aria-label={describe(key)}
                  className={`flex h-(--u) flex-col items-center justify-center gap-0.5 ${key.tone ? `${TONES[key.tone]} text-[#1a0f11]` : 'bg-surface-container-high text-outline'}`}
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
        <div className="flex flex-wrap items-center gap-2.5 border-t border-surface-container-highest pt-4">
          <p className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{t('weakest')}</p>
          <ul className="flex flex-wrap gap-2">
            {weakest.map((key) => (
              <li key={key.label} className="font-label-code bg-error-container/60 px-2.5 py-1 text-[13px] text-on-error-container">
                {keyName(key)} · {value(key)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
