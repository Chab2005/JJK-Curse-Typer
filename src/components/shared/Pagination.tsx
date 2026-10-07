'use client';

import { useTranslations } from 'next-intl';
import BevelFrame from '@/components/shared/BevelFrame';

// Flèches précédente / suivante autour du numéro de page (lobbies, classement).
export default function Pagination({ label, page, pageCount, onChange }: { label: string; page: number; pageCount: number; onChange: (page: number) => void }) {
  const t = useTranslations('Pagination');

  return (
    <nav aria-label={label} className="flex items-center justify-center gap-3">
      <ArrowButton icon="arrow_back" label={t('previous')} disabled={page <= 1} onClick={() => onChange(page - 1)} />
      <p aria-live="polite" className="font-label-code min-w-36 border border-surface-container-highest bg-surface-container-lowest px-4 py-2.5 text-center text-[13px] uppercase tracking-[0.12em] text-on-surface-variant">
        {t('status', { page, pageCount })}
      </p>
      <ArrowButton icon="arrow_forward" label={t('next')} disabled={page >= pageCount} onClick={() => onChange(page + 1)} />
    </nav>
  );
}

function ArrowButton({ icon, label, disabled, onClick }: { icon: string; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <BevelFrame
      as="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      frame="group flex bg-outline-variant transition-colors hover:bg-primary disabled:pointer-events-none disabled:opacity-40"
      className="flex size-11 items-center justify-center bg-surface-container-lowest text-on-surface-variant transition-colors group-hover:bg-surface-container-high group-hover:text-primary"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-xl">{icon}</span>
    </BevelFrame>
  );
}
