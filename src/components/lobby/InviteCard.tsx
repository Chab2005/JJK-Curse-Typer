'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

// Code du lobby et lien d'invitation à partager (LOB-3, LOB-4).
export default function InviteCard({ code }: { code: string }) {
  const t = useTranslations('Lobby.invite');

  return (
    <div className="bevel bg-linear-160 from-primary-container via-outline-variant via-40% to-secondary-container p-px">
      <div className="bevel flex flex-col gap-4 bg-surface-container-low px-6 pt-5 pb-6">
        <h2 className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{t('title')}</h2>
        <div className="flex flex-col gap-1">
          <p className="font-label-code text-[11px] uppercase tracking-[0.2em] text-outline">{t('code')}</p>
          <p className="font-label-code text-[34px] leading-tight font-bold tracking-[0.2em] text-primary">{code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton icon="content_copy" label={t('copyCode')} text={() => code} />
          {/* Lien de la page sans ?spectate=1 : l'invité rejoint comme participant. */}
          <CopyButton icon="link" label={t('copyLink')} text={() => window.location.origin + window.location.pathname} />
        </div>
      </div>
    </div>
  );
}

function CopyButton({ icon, label, text }: { icon: string; label: string; text: () => string }) {
  const t = useTranslations('Lobby.invite');
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      setState('copied');
    } catch {
      setState('failed');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="flex min-h-11 items-center gap-2 border border-surface-container-highest px-4 text-[13px] uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">{state === 'copied' ? 'check' : icon}</span>
      <span aria-live="polite">{state === 'copied' ? t('copied') : state === 'failed' ? t('copyFailed') : label}</span>
    </button>
  );
}
