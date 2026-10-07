'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef } from 'react';
import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';

// Confirmation avant d'abandonner ou de quitter la course (maquette « Course » : liens de l'en-tête).
// <dialog> natif : focus piégé, Échap pour annuler.
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
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
      <BevelFrame frame={cardFrame} className="flex flex-col gap-4 bg-surface-container-low px-6 pt-7 pb-6">
        <h2 id={`${id}-title`} className="text-[22px] uppercase tracking-[0.12em]">{title}</h2>
        <p id={`${id}-body`} className="text-on-surface-variant">{body}</p>
        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-11 items-center border border-on-surface px-4 text-[13px] uppercase tracking-[0.12em] transition-colors hover:bg-on-surface hover:text-surface-container-lowest"
          >
            {t('stay')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex min-h-11 items-center bg-primary-container px-4 text-[13px] uppercase tracking-[0.12em] text-on-primary-container transition-colors hover:bg-inverse-primary"
          >
            {confirmLabel}
          </button>
        </div>
      </BevelFrame>
    </dialog>
  );
}
