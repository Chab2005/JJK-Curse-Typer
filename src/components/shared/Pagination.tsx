'use client';

import { useTranslations } from 'next-intl';
import SpearArrow from '@/components/shared/SpearArrow';

// Flèches précédente / suivante autour du numéro de page (lobbies, classement).
export default function Pagination({ label, page, pageCount, onChange }: { label: string; page: number; pageCount: number; onChange: (page: number) => void }) {
  const t = useTranslations('Pagination');

  return (
    <nav aria-label={label} className="flex items-center justify-center gap-3">
      <ArrowButton direction="left" label={t('previous')} disabled={page <= 1} onClick={() => onChange(page - 1)} />
      <p aria-live="polite" className="font-label-code min-w-36 border border-surface-container-highest bg-surface-container-lowest px-4 py-2.5 text-center text-[13px] uppercase tracking-[0.12em] text-on-surface-variant">
        {t('status', { page, pageCount })}
      </p>
      <ArrowButton direction="right" label={t('next')} disabled={page >= pageCount} onClick={() => onChange(page + 1)} />
    </nav>
  );
}

// Flèche en lance : avance d'un cran dans sa direction et s'éclaire au survol.
function ArrowButton({ direction, label, disabled, onClick }: { direction: 'left' | 'right'; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-11 w-24 items-center justify-center text-primary-container transition-[translate,filter] duration-300 hover:brightness-140 hover:drop-shadow-[0_0_8px_rgb(225_29_72/0.55)] disabled:pointer-events-none disabled:opacity-30 motion-reduce:transition-none ${
        direction === 'left' ? 'hover:-translate-x-1.5' : 'hover:translate-x-1.5'
      }`}
    >
      <SpearArrow direction={direction} className="h-7 w-21" />
    </button>
  );
}
