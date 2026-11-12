'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef } from 'react';
import BevelPanel from '@/components/shared/BevelPanel';
import ChevronButton from '@/components/shared/ChevronButton';

// Confirmation avant d'abandonner ou de quitter la course (maquette « Course » : liens de l'en-tête).
// <dialog> natif : focus piégé, Échap pour annuler.
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  icon = 'flag',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  /** Libellé du bouton d'annulation ; « Continuer la course » par défaut. */
  cancelLabel?: string;
  /** Icône Material du bouton de confirmation. */
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Race.leave');
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(calc(100vw-32px),480px)] bg-transparent p-0 text-on-surface backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <BevelPanel className="flex flex-col gap-3.5 px-8 pt-[30px] pb-7">
        <h2 id={`${id}-title`} className="text-[26px] uppercase tracking-[0.08em]">{title}</h2>
        <p id={`${id}-body`} className="text-[17px] leading-[26px] text-on-surface-variant">{body}</p>
        <div className="mt-1 flex flex-wrap justify-end gap-2.5 border-t border-[#8f1022]/60 pt-2.5">
          <ChevronButton type="button" size="sm" chevrons={false} onClick={onCancel} className="font-label-code text-[11px] uppercase tracking-[0.16em]">
            {cancelLabel ?? t('stay')}
          </ChevronButton>
          <ChevronButton type="button" size="sm" chevrons={false} variant="primary" onClick={onConfirm} className="font-label-code text-[11px] uppercase tracking-[0.16em]">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">{icon}</span>
            {confirmLabel}
          </ChevronButton>
        </div>
      </BevelPanel>
    </dialog>
  );
}
