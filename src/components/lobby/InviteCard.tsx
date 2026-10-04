'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, useSyncExternalStore } from 'react';
import { createInviteAction } from '@/app/actions/lobbies';
import Reserve from '@/components/shared/Reserve';
import { canCopyCode, inviteLinkMode, inviteUrl } from './lobbyAccess';
import type { LobbyVisibility } from './lobbyRoom';

type CopyState = 'idle' | 'copied' | 'failed';

/** Adresse de la page sans ?spectate=1 ni ?invite= : l'invité rejoint comme participant. */
const lobbyUrl = () => window.location.origin + window.location.pathname;

const subscribeNever = () => () => {};

/** Adresse du lobby, vide au rendu serveur qui ne connaît pas `window`. */
const useLobbyUrl = () => useSyncExternalStore(subscribeNever, lobbyUrl, () => '');

// Code du lobby et lien à partager (LOB-3, LOB-4). Seul l'hôte partage un lien : l'adresse d'un lobby public,
// ou un lien à usage unique par personne sinon. Un lobby privé ne montre pas son code.
// La carte garde les mêmes blocs et la même taille quels que soient l'accès, le rôle et le lien créé.
export default function InviteCard({ code, visibility, isHost }: { code: string; visibility: LobbyVisibility; isHost: boolean }) {
  const t = useTranslations('Lobby.invite');
  const mode = inviteLinkMode(visibility, isHost);
  const url = useLobbyUrl();
  const [created, setCreated] = useState('');
  const shownLink = mode === 'url' ? url : mode === 'oneTime' ? created : '';

  // Chaque clic crée un lien neuf sur le serveur et le copie ; le dernier reste affiché pour une copie à la main.
  const createLink = async () => {
    const token = await createInviteAction(code);
    if (!token) throw new Error('invite refused');
    const link = inviteUrl(lobbyUrl(), token);
    setCreated(link);
    return link;
  };

  return (
    <div className="bevel bg-linear-160 from-primary-container via-outline-variant via-40% to-secondary-container p-px">
      <div className="bevel flex flex-col gap-4 bg-surface-container-low px-6 pt-5 pb-6">
        <h2 className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{t('title')}</h2>

        <div className="flex flex-col gap-1">
          <p className="font-label-code text-[11px] uppercase tracking-[0.2em] text-outline">{t('code')}</p>
          <div className="flex h-11 items-center justify-between gap-3">
            {canCopyCode(visibility) ? (
              <>
                <p className="font-label-code text-[34px] leading-tight font-bold tracking-[0.2em] text-primary">{code}</p>
                <CopyButton iconOnly icon="content_copy" label={t('copyCode')} copy={async () => code} />
              </>
            ) : (
              <p className="flex items-center gap-2 text-[14px] leading-5 text-on-surface-variant">
                <span aria-hidden="true" className="material-symbols-outlined w-[18px] shrink-0 overflow-hidden text-[18px]! text-outline">lock</span>
                {t('privateCode')}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="invite-link" className="font-label-code text-[11px] uppercase tracking-[0.2em] text-outline">{t('link')}</label>
          <input
            id="invite-link"
            readOnly
            disabled={mode === 'hostOnly'}
            value={shownLink}
            placeholder={mode === 'hostOnly' ? t('hostOnlyField') : t('noLinkYet')}
            onFocus={(e) => e.target.select()}
            className="font-label-code h-10 w-full text-ellipsis border border-surface-container-highest bg-surface-container-lowest px-3 text-[13px] text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none disabled:cursor-not-allowed"
          />
          {/* Le libellé suit l'accès, même pour un joueur à qui le bouton reste désactivé. */}
          {visibility === 'public' ? (
            <CopyButton key="url" icon="link" label={t('copyLink')} copy={async () => lobbyUrl()} disabled={mode === 'hostOnly'} />
          ) : (
            <CopyButton key="oneTime" icon="add_link" label={t('newLink')} copy={createLink} disabled={mode === 'hostOnly'} />
          )}
        </div>

        <Reserve
          active={mode}
          variants={{
            url: <Note>{t('urlNote')}</Note>,
            oneTime: <Note>{t('oneTime')}</Note>,
            hostOnly: <Note>{t('hostOnly')}</Note>,
          }}
        />
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] leading-5 text-outline">{children}</p>;
}

// Bouton qui copie un texte et le confirme sans changer de taille : les libellés sont superposés (<Reserve>).
function CopyButton({ icon, label, copy, iconOnly = false, disabled = false }: { icon: string; label: string; copy: () => Promise<string>; iconOnly?: boolean; disabled?: boolean }) {
  const t = useTranslations('Lobby.invite');
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const labels: Record<CopyState, string> = { idle: label, copied: t('copied'), failed: t('copyFailed') };

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

  const iconNode = (
    <span aria-hidden="true" className="material-symbols-outlined w-[18px] shrink-0 overflow-hidden text-[18px]!">
      {state === 'copied' ? 'check' : state === 'failed' ? 'error' : icon}
    </span>
  );
  const border = 'border border-surface-container-highest text-on-surface transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:text-outline';

  return (
    <>
      {iconOnly ? (
        <button type="button" onClick={onClick} disabled={disabled} aria-label={labels[state]} title={label} className={`grid size-11 shrink-0 place-items-center ${border}`}>
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
