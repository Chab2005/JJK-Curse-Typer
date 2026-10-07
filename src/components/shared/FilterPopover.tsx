'use client';

import { useEffect, useId, useRef, useState } from 'react';
import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';

// Bouton « Filtres » qui ouvre un panneau sous lui ; Échap ou un clic à l'extérieur le ferment.
export default function FilterPopover({
  label,
  icon = 'tune',
  resetLabel,
  onReset,
  closeLabel,
  children,
}: {
  label: string;
  icon?: string;
  /** Bouton « Réinitialiser » du pied du panneau, affiché si `onReset` est fourni. */
  resetLabel?: string;
  onReset?: () => void;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`group diamond-ends flex p-px transition-colors ${open ? 'bg-primary' : 'bg-error-container hover:bg-primary'}`}
      >
        <span className="diamond-ends flex min-h-[50px] items-center gap-2.5 bg-surface-container-lowest px-6 text-sm uppercase tracking-[0.14em] text-on-surface transition-colors group-hover:bg-surface-container-high">
          <span aria-hidden="true" className="material-symbols-outlined text-lg text-primary">{icon}</span>
          {label}
        </span>
      </button>

      {/* L'ombre est un filtre sur l'enveloppe : posée sur le cadre, son clip-path la couperait. */}
      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 z-30 mt-2 sm:right-0 sm:left-auto w-[min(calc(100vw-48px),380px)] drop-shadow-[0_24px_40px_rgb(0_0_0/0.55)]"
      >
        <BevelFrame frame={cardFrame} className="bg-surface-container-low p-5">
          {children}
          <div className="mt-5 flex gap-3 border-t border-surface-container-highest pt-4">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="min-h-11 flex-1 border border-surface-container-highest text-[13px] uppercase tracking-[0.12em] text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
              >
                {resetLabel}
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="min-h-11 flex-1 bg-primary-container text-[13px] uppercase tracking-[0.12em] text-on-primary-container transition-colors hover:bg-inverse-primary"
            >
              {closeLabel}
            </button>
          </div>
        </BevelFrame>
      </div>
    </div>
  );
}
