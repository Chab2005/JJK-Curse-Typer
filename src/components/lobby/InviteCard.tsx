'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { createInviteAction } from '@/app/actions/lobbies';
import { inviteUrl } from './lobbyAccess';
import type { LobbyVisibility } from './lobbyRoom';

type CopyState = 'idle' | 'copied' | 'failed';

/** Adresse de la page sans ?spectate=1 ni ?invite= : l'invité rejoint comme participant. */
const lobbyUrl = () => window.location.origin + window.location.pathname;

// Code du lobby et liens à partager (LOB-3, LOB-4). Un lobby privé ne montre pas son code :
// seul l'hôte y invite, avec un lien à usage unique par personne.
export default function InviteCard({ code, visibility, isHost }: { code: string; visibility: LobbyVisibility; isHost: boolean }) {
  const t = useTranslations('Lobby.invite');
  const isPrivate = visibility === 'private';
  const oneTimeLinks = isHost && visibility !== 'public';

  return (
    <div className="bevel bg-linear-160 from-primary-container via-outline-variant via-40% to-secondary-container p-px">
      <div className="bevel flex flex-col gap-4 bg-surface-container-low px-6 pt-5 pb-6">
        <h2 className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{t('title')}</h2>
        {!isPrivate && (
          <div className="flex flex-col gap-1">
            <p className="font-label-code text-[11px] uppercase tracking-[0.2em] text-outline">{t('code')}</p>
            <p className="font-label-code text-[34px] leading-tight font-bold tracking-[0.2em] text-primary">{code}</p>
          </div>
        )}
        {isPrivate && !isHost ? (
          <p className="max-w-[280px] text-[14px] text-on-surface-variant">{t('hostOnly')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {!isPrivate && <CopyButton icon="content_copy" label={t('copyCode')} copy={async () => code} />}
            {oneTimeLinks ? <NewInviteLink code={code} /> : <CopyButton icon="link" label={t('copyLink')} copy={async () => lobbyUrl()} />}
          </div>
        )}
        {oneTimeLinks && <p className="max-w-[280px] text-[13px] text-outline">{t('oneTime')}</p>}
      </div>
    </div>
  );
}

// Chaque clic crée un lien neuf sur le serveur et le copie ; le dernier reste affiché pour une copie à la main.
function NewInviteLink({ code }: { code: string }) {
  const t = useTranslations('Lobby.invite');
  const [link, setLink] = useState<string | null>(null);

  const create = async () => {
    const token = await createInviteAction(code);
    if (!token) throw new Error('invite refused');
    const url = inviteUrl(lobbyUrl(), token);
    setLink(url);
    return url;
  };

  return (
    <>
      <CopyButton icon="add_link" label={t('newLink')} copy={create} />
      {link && (
        <div className="flex w-full flex-col gap-1">
          <label htmlFor="invite-link" className="font-label-code text-[11px] uppercase tracking-[0.2em] text-outline">{t('lastLink')}</label>
          <input
            id="invite-link"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="font-label-code min-h-10 w-full border border-surface-container-highest bg-surface-container-lowest px-3 text-[13px] text-on-surface focus:border-primary-container focus:outline-none"
          />
        </div>
      )}
    </>
  );
}

function CopyButton({ icon, label, copy }: { icon: string; label: string; copy: () => Promise<string> }) {
  const t = useTranslations('Lobby.invite');
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(await copy());
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
      onClick={onClick}
      className="flex min-h-11 items-center gap-2 border border-surface-container-highest px-4 text-[13px] uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">{state === 'copied' ? 'check' : icon}</span>
      <span aria-live="polite">{state === 'copied' ? t('copied') : state === 'failed' ? t('copyFailed') : label}</span>
    </button>
  );
}
