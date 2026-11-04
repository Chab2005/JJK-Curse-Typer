'use client';

import { useTranslations } from 'next-intl';
import { useLayoutEffect, useRef } from 'react';
import type { CastAbility } from '@/game/abilities';
import { promptPreview, type CastPrompt } from '@/game/castPrompt';

// Fenêtre de lancement (canvas « Course · lancement d'une technique ») : une ligne qui propose un nom et le complète selon la frappe.
// Le joueur tape dans le champ de la course, qui garde le focus : rien ici ne le prend, un clic ne fait rien.
export default function CastDialog({ prompt, costOf }: { prompt: CastPrompt<CastAbility>; costOf: (id: CastAbility) => string }) {
  const t = useTranslations('Race.cast');
  const lineRef = useRef<HTMLSpanElement>(null);
  const restRef = useRef<HTMLSpanElement>(null);
  const { id, name } = promptPreview(prompt);
  const chars = [...name];
  const typed = chars.slice(0, prompt.typed.length).join('');
  const rest = chars.slice(prompt.typed.length).join('');

  // Un nom plus long que la ligne (l'incantation de Mahoraga) défile avec la frappe.
  useLayoutEffect(() => {
    const line = lineRef.current;
    const next = restRef.current;
    if (line && next) line.scrollLeft = Math.max(0, next.offsetLeft - line.offsetLeft - line.clientWidth / 2);
  }, [prompt.typed, name]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cast-title" onMouseDown={(e) => e.preventDefault()} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2.5 bg-black/40 px-4">
      <p id="cast-title" className="font-label-code text-center text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">{t('title')}</p>
      <div className="hx-cut flex w-[min(100%,560px)] bg-primary-container p-px [--h:14px]">
        <div className="hx-cut flex min-h-[58px] w-full min-w-0 items-center justify-between gap-6 bg-[radial-gradient(120%_160%_at_50%_0%,#2a0b10_0%,#170608_55%,#0c0304_100%)] px-[30px] [--h:13.5px]">
          <span ref={lineRef} data-testid="cast-line" className="font-label-code min-w-0 overflow-hidden text-[20px] leading-7 whitespace-pre">
            <span className="font-label-code font-bold text-on-primary-container">{typed}</span>
            <span ref={restRef} className="font-label-code text-outline">{rest}</span>
          </span>
          <span className="font-label-code shrink-0 text-[13px] tracking-[0.08em] text-tertiary">{costOf(id)}</span>
        </div>
      </div>
    </div>
  );
}
