'use client';

import { useTranslations } from 'next-intl';
import { GRACE_KEYS, fold, promptChoice, type CastPrompt } from '@/game/castPrompt';
import type { CastAbility } from '@/game/abilities';
import BevelPanel from '@/components/shared/BevelPanel';

export type CastRow = {
  id: CastAbility;
  name: string;
  cost: string;
};

// Fenêtre de lancement (canvas « Course · lancement d'une technique ») : le joueur tape un nom dans le champ de la course,
// qui garde le focus. Rien ici ne le prend : un clic ne fait rien, et seule une faute ou le nom complet la ferme.
export default function CastDialog({ prompt, rows }: { prompt: CastPrompt<CastAbility>; rows: CastRow[] }) {
  const t = useTranslations('Race.cast');
  const castable = new Set(prompt.options.map((option) => option.id));
  const chosen = promptChoice(prompt);
  const grace = Math.max(0, GRACE_KEYS - prompt.keys);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cast-title"
      onMouseDown={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
    >
      <BevelPanel frame="w-[min(100%,640px)]" className="flex flex-col gap-4 px-7 pt-6 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-label-code text-[11px] font-bold uppercase tracking-[0.28em] text-primary-container">{t(`kind.${prompt.kind}`)}</p>
            <h2 id="cast-title" className="text-[26px] uppercase tracking-[0.08em]">{t('title')}</h2>
          </div>
          <div className="font-label-code flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-outline" role="img" aria-label={t('graceLeft', { count: grace })}>
            <span aria-hidden="true">{t('grace')}</span>
            {Array.from({ length: GRACE_KEYS }, (_, i) => (
              <span key={i} aria-hidden="true" className={`size-3 ${i < grace ? 'bg-primary-container' : 'bg-[#2a1416]'}`} />
            ))}
          </div>
        </div>

        <ul className="flex flex-col border-y border-[#8f1022]/60 py-1.5">
          {rows.map(({ id, name, cost }) => {
            const open = castable.has(id);
            const typed = open && fold(name).startsWith(prompt.typed) ? prompt.typed.length : 0;
            const faded = !open || (prompt.typed !== '' && typed === 0);
            const active = chosen === id;
            return (
              <li
                key={id}
                data-state={active ? 'chosen' : faded ? 'faded' : 'open'}
                className={`flex min-h-10 items-center justify-between gap-6 border-l-[3px] px-4 py-1.5 ${active ? 'border-primary-container bg-primary-container/15' : 'border-transparent'} ${faded ? 'opacity-45' : ''}`}
              >
                <span className="font-label-code text-[17px] leading-6 whitespace-pre-wrap text-on-surface-variant">
                  <span className="font-bold text-on-primary-container underline decoration-primary-container underline-offset-[5px]">{[...name].slice(0, typed).join('')}</span>
                  {[...name].slice(typed).join('')}
                </span>
                <span className="font-label-code shrink-0 text-[12px] tracking-[0.08em] text-tertiary">{cost}</span>
              </li>
            );
          })}
        </ul>

        <p className="text-[14px] leading-[21px] text-outline">{t('hint', { count: GRACE_KEYS })}</p>
      </BevelPanel>
    </div>
  );
}
