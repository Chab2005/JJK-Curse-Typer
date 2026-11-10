'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';
import ChevronButton from '@/components/shared/ChevronButton';

// Le visiteur est déjà dans un autre lobby (SALLE-06) : une fenêtre modale lui propose de le quitter pour rejoindre celui-ci,
// ou de rester où il est. Échap vaut « rester ».
export default function LeaveCurrentLobbyDialog({ current, onLeave, onStay }: { current: string; onLeave: () => void; onStay: () => void }) {
  const t = useTranslations('Lobby.conflict');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="conflict-title"
      aria-describedby="conflict-text"
      onCancel={(e) => {
        e.preventDefault();
        onStay();
      }}
      className="m-auto w-[min(calc(100vw-32px),520px)] overflow-clip bg-transparent p-0 text-on-surface backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <BevelFrame frame={cardFrame} className="flex flex-col gap-6 bg-surface-container-low px-6 py-7 sm:px-8">
        <h2 id="conflict-title" className="text-[22px] uppercase tracking-[0.12em]">{t('title')}</h2>
        <p id="conflict-text" className="text-on-surface-variant">{t('text', { code: current })}</p>
        <div className="flex flex-col gap-3">
          <ChevronButton type="button" size="sm" variant="primary" chevrons={false} onClick={onLeave} frame="w-full" className="font-label-code text-[11px] uppercase tracking-[0.16em]">
            {t('leave')}
          </ChevronButton>
          <ChevronButton type="button" size="sm" chevrons={false} onClick={onStay} frame="w-full" className="font-label-code text-[11px] uppercase tracking-[0.16em]">
            {t('stay')}
          </ChevronButton>
        </div>
      </BevelFrame>
    </dialog>
  );
}
