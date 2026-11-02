'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ChevronButton from '@/components/shared/ChevronButton';

// Bouton-flèche « Filtres » qui ouvre un panneau sous lui ; Échap ou un clic à l'extérieur le ferment.
// Le panneau a le cadre à double filet des cartes personnage (cadre, vide, filet, face).
// `portal` : le panneau est rendu dans <body>, sous le bouton et aligné à sa gauche, pour ne pas être rogné par un cadre biseauté (clip-path).
export default function FilterPopover({
  label,
  icon = 'tune',
  chevrons = false,
  resetLabel,
  onReset,
  closeLabel,
  portal = false,
  footerAlign = 'center',
  children,
}: {
  label: React.ReactNode;
  icon?: string;
  /** `true` : chevrons des deux côtés du bouton ; `false` : la plaque seule, comme « Rejoindre par code » de l'accueil. */
  chevrons?: boolean;
  /** Bouton « Réinitialiser » du pied du panneau, affiché si `onReset` est fourni. */
  resetLabel?: string;
  onReset?: () => void;
  closeLabel: string;
  portal?: boolean;
  /** Boutons du pied du panneau : centrés, ou à droite. */
  footerAlign?: 'center' | 'end';
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    // Position en coordonnées du document : le panneau suit la page au défilement, recalculée au redimensionnement.
    const placePanel = () => {
      const box = buttonRef.current?.getBoundingClientRect();
      if (!box) return;
      const width = Math.min(window.innerWidth - 48, 400);
      setPlace({ top: box.bottom + window.scrollY + 10, left: Math.max(16, Math.min(box.left, window.innerWidth - width - 16)) + window.scrollX });
    };
    if (portal) {
      placePanel();
      window.addEventListener('resize', placePanel);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', placePanel);
    };
  }, [open, portal]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const frame = (
    <div className="bevel-var bg-[#8f1022] p-px [--b:14px]">
      <div className="bevel-var bg-[#0b0405] p-[3px] [--b:13.5px]">
        <div className="bevel-var bg-primary-container/40 p-px [--b:12px]">
          <div className="bevel-var bg-[radial-gradient(120%_120%_at_50%_0%,#2a0b10_0%,#150608_55%,#0c0304_100%)] px-[22px] py-6 [--b:11.5px]">
            {children}
            <div className={`mt-5 flex gap-2.5 border-t border-[#8f1022]/60 pt-4 ${footerAlign === 'end' ? 'justify-end' : 'justify-center'}`}>
              {onReset && (
                <ChevronButton type="button" size="sm" chevrons={false} onClick={onReset} className="font-label-code text-[11px] uppercase tracking-[0.16em]">
                  {resetLabel}
                </ChevronButton>
              )}
              <ChevronButton type="button" size="sm" variant="primary" chevrons={false} onClick={close} className="font-label-code text-[11px] uppercase tracking-[0.16em]">
                {closeLabel}
              </ChevronButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="relative">
      <ChevronButton
        ref={buttonRef}
        type="button"
        chevrons={chevrons}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="text-[15px] uppercase tracking-[0.14em] whitespace-nowrap"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-lg text-primary">{icon}</span>
        {label}
      </ChevronButton>

      {/* L'ombre est un filtre sur l'enveloppe : posée sur le cadre, son clip-path la couperait. */}
      {portal ? (
        open &&
        place &&
        createPortal(
          <div ref={panelRef} id={panelId} style={place} className="absolute z-30 w-[min(calc(100vw-48px),400px)] drop-shadow-[0_24px_40px_rgb(0_0_0/0.6)]">
            {frame}
          </div>,
          document.body,
        )
      ) : (
        <div
          id={panelId}
          hidden={!open}
          className="absolute top-full left-0 z-30 mt-2.5 sm:right-0 sm:left-auto w-[min(calc(100vw-48px),400px)] drop-shadow-[0_24px_40px_rgb(0_0_0/0.6)]"
        >
          {frame}
        </div>
      )}
    </div>
  );
}
