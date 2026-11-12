'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { ABILITY_KEYS } from '@/game/abilities';
import { modifierKey } from '@/lib/platform';
import { useOs } from '@/components/shared/useOs';

// Texte du bloc « Commandes » : la touche à maintenir selon le système, puis l'avertissement sur les macros
// et raccourcis système qui prendraient le dessus sur ceux du site.
export default function ControlsIntro() {
  const t = useTranslations('Guide.controls');
  const format = useFormatter();
  const modifier = modifierKey(useOs());
  const key = modifier.symbol === modifier.name ? modifier.name : `${modifier.name} (${modifier.symbol})`;
  const combos = format.list(Object.values(ABILITY_KEYS).map((letter) => `${modifier.symbol} + ${letter}`), { type: 'disjunction' });

  return (
    <>
      <p className="max-w-[720px] text-base leading-[25px] text-on-surface-variant">{t('intro', { key })}</p>
      <p role="note" className="flex max-w-[720px] items-start gap-2.5 border-l-2 border-primary-container bg-primary-container/10 px-4 py-3 text-sm leading-[22px] text-on-surface-variant">
        <span aria-hidden="true" className="material-symbols-outlined text-lg leading-[22px] text-primary-text">warning</span>
        <span>{t('warning', { combos })}</span>
      </p>
    </>
  );
}
