'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import Reserve from '@/components/shared/Reserve';

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Copie un texte qui peut encore attendre le serveur. Safari refuse une écriture lancée après un `await` :
 * la promesse est confiée tout de suite au presse-papiers, pendant le clic.
 */
function copyText(text: Promise<string>): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard.write) return text.then((value) => navigator.clipboard.writeText(value));
  return navigator.clipboard.write([new ClipboardItem({ 'text/plain': text.then((value) => new Blob([value], { type: 'text/plain' })) })]);
}

// Bouton qui copie un texte et le confirme sans changer de taille : les libellés sont superposés (<Reserve>).
// `copy` est appelé pendant le clic ; s'il échoue, le bouton annonce l'échec. `bare` : icône sans bordure, comme <IconButton>.
export default function CopyButton({
  icon,
  label,
  copy,
  iconOnly = false,
  disabled = false,
  bare = false,
}: {
  icon: string;
  label: string;
  copy: () => Promise<string>;
  iconOnly?: boolean;
  disabled?: boolean;
  bare?: boolean;
}) {
  const t = useTranslations('Lobby.invite');
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const labels: Record<CopyState, string> = { idle: label, copied: t('copied'), failed: t('copyFailed') };

  const onClick = async () => {
    try {
      await copyText(copy());
      setState('copied');
    } catch {
      setState('failed');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  };

  const iconNode = (
    <span aria-hidden="true" className="material-symbols-outlined w-[18px] shrink-0 overflow-hidden text-[18px]!">
      {state === 'copied' ? 'check' : state === 'failed' ? 'error' : icon}
    </span>
  );
  const border = 'border border-surface-container-highest text-on-surface transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:text-outline';
  const iconBox = bare ? 'size-10 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary' : `size-11 ${border}`;

  return (
    <>
      {iconOnly ? (
        <button type="button" onClick={onClick} disabled={disabled} aria-label={labels[state]} title={label} className={`grid shrink-0 place-items-center ${iconBox}`}>
          {iconNode}
        </button>
      ) : (
        <button type="button" onClick={onClick} disabled={disabled} className={`flex min-h-11 w-full items-center justify-center gap-2 px-4 text-[13px] uppercase tracking-[0.12em] ${border}`}>
          {iconNode}
          <Reserve active={state} variants={labels} className="text-left" />
        </button>
      )}
      <span aria-live="polite" className="sr-only">
        {state === 'idle' ? '' : labels[state]}
      </span>
    </>
  );
}
