'use client';

import { useTranslations } from 'next-intl';
import SpearArrow from '@/components/shared/SpearArrow';

// Flèches précédente / suivante autour du numéro de page (lobbies, classement), posé sur une plaque pointée.
export default function Pagination({ label, page, pageCount, onChange }: { label: string; page: number; pageCount: number; onChange: (page: number) => void }) {
  const t = useTranslations('Pagination');

  return (
    <nav aria-label={label} className="flex items-center justify-center gap-3.5">
      <ArrowButton direction="left" label={t('previous')} disabled={page <= 1} onClick={() => onChange(page - 1)} />
      <p aria-live="polite" className="hx-cut bg-[#8f1022] p-px [--h:13px]">
        <span className="hx-cut font-label-code block min-w-[150px] bg-[radial-gradient(120%_160%_at_50%_0%,#3a0c14_0%,#170608_55%,#0c0304_100%)] px-[30px] py-[11px] text-center text-[12px] uppercase tracking-[0.16em] text-on-surface-variant [--h:12.5px]">
          {t('status', { page, pageCount })}
        </span>
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
      className={`flex min-h-12 min-w-[136px] items-center justify-center px-1 text-primary-container transition-[translate,filter] duration-300 hover:brightness-140 hover:drop-shadow-[0_0_10px_rgb(225_29_72/0.55)] disabled:pointer-events-none disabled:opacity-30 motion-reduce:transition-none ${
        direction === 'left' ? 'hover:-translate-x-1.5' : 'hover:translate-x-1.5'
      }`}
    >
      <SpearArrow direction={direction} className="h-10 w-30" />
    </button>
  );
}
