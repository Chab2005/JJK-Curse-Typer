'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createInvitesAction, deleteInviteAction, listInvitesAction } from '@/app/actions/lobbies';
import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';
import Reserve from '@/components/shared/Reserve';
import CopyButton from './CopyButton';
import { type InviteLink, type InviteLinkMode, inviteUrl, MAX_INVITES } from './lobbyAccess';
import { NumberField } from './LobbySettingsPanel';

/** Adresse de la page sans ?spectate=1 ni ?invite= : l'invité rejoint comme participant. */
const lobbyUrl = () => window.location.origin + window.location.pathname;

const subscribeNever = () => () => {};

/** Adresse du lobby, vide au rendu serveur qui ne connaît pas `window`. */
const useLobbyUrl = () => useSyncExternalStore(subscribeNever, lobbyUrl, () => '');

const STATUS_DOT: Record<InviteLink['status'], string> = { unused: 'bg-tertiary', used: 'bg-primary', revoked: 'bg-error' };

// Fenêtre des liens d'invitation de l'hôte (LOB-3, LOB-4). Lobby public : son adresse, à copier.
// Sinon, jusqu'à MAX_INVITES liens à usage unique : en créer un ou un lot (copiés aussitôt), voir qui a utilisé chacun,
// copier ou supprimer un lien. La liste est relue à l'ouverture et à chaque arrivée ou départ (`refreshKey`).
// La liste a une hauteur fixe : créer ou supprimer un lien ne redimensionne pas la fenêtre.
export default function InviteLinksDialog({ code, mode, refreshKey }: { code: string; mode: InviteLinkMode; refreshKey: string }) {
  const t = useTranslations('Lobby.invite');
  const td = useTranslations('Lobby.invite.dialog');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setOpen] = useState(false);

  const open = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };
  const close = () => {
    dialogRef.current?.close();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={mode === 'hostOnly'}
        aria-haspopup="dialog"
        className="flex min-h-11 w-full items-center justify-center gap-2 border border-surface-container-highest px-4 text-[13px] uppercase tracking-[0.12em] text-on-surface transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:text-outline"
      >
        <span aria-hidden="true" className="material-symbols-outlined w-[18px] shrink-0 overflow-hidden text-[18px]!">link</span>
        {t('manage')}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="invite-dialog-title"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto w-[min(calc(100vw-32px),560px)] overflow-clip bg-transparent p-0 text-on-surface backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <BevelFrame frame={`flex max-h-[calc(100dvh-112px)] flex-col ${cardFrame}`} className="flex min-h-0 flex-col bg-surface-container-low">
          <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 sm:px-8">
            <h2 id="invite-dialog-title" className="text-[22px] uppercase tracking-[0.12em]">{td('title')}</h2>
            <button type="button" onClick={close} aria-label={td('close')} className="flex size-10 items-center justify-center text-on-surface-variant transition-colors hover:text-primary">
              <span aria-hidden="true" className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 pb-7 sm:px-8">
            {mode === 'url' && <LobbyLink />}
            {mode === 'oneTime' && <OneTimeLinks code={code} active={isOpen} refreshKey={refreshKey} />}
          </div>
        </BevelFrame>
      </dialog>
    </>
  );
}

function FieldLabel({ htmlFor, id, children }: { htmlFor?: string; id?: string; children: React.ReactNode }) {
  const className = 'font-label-code text-[11px] font-bold uppercase tracking-[0.2em] text-primary';
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>{children}</label>
  ) : (
    <p id={id} className={className}>{children}</p>
  );
}

function LobbyLink() {
  const t = useTranslations('Lobby.invite');
  const td = useTranslations('Lobby.invite.dialog');
  const url = useLobbyUrl();

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="invite-lobby-link">{td('lobbyLink')}</FieldLabel>
      <input
        id="invite-lobby-link"
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="font-label-code h-11 w-full text-ellipsis border border-surface-container-highest bg-surface-container-lowest px-3 text-[13px] text-on-surface focus:border-primary-container focus:outline-none"
      />
      <CopyButton icon="link" label={td('copyLink')} copy={async () => lobbyUrl()} />
      <p className="text-[13px] leading-5 text-outline">{t('urlNote')}</p>
    </div>
  );
}

function OneTimeLinks({ code, active, refreshKey }: { code: string; active: boolean; refreshKey: string }) {
  const td = useTranslations('Lobby.invite.dialog');
  const [links, setLinks] = useState<InviteLink[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [batch, setBatch] = useState(5);

  // Relue à l'ouverture, à chaque arrivée ou départ, et après une suppression refusée. Une réponse périmée est ignorée.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    listInvitesAction(code)
      .then((next) => {
        if (cancelled) return;
        setFailed(next === null);
        if (next) setLinks(next);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [active, code, refreshKey, reload]);

  const remaining = MAX_INVITES - (links?.length ?? 0);
  const full = remaining <= 0;
  const batchMax = Math.max(1, remaining);
  const count = Math.min(batch, batchMax);
  const cannotCreate = links === null || full;

  // Crée `n` liens, les met en tête de liste et renvoie leurs adresses, une par ligne, pour le presse-papiers.
  const create = async (n: number) => {
    const tokens = await createInvitesAction(code, n);
    if (!tokens || tokens.length === 0) throw new Error('invite refused');
    const created = tokens.map((token): InviteLink => ({ token, status: 'unused', usedBy: null })).reverse();
    setLinks((current) => [...created, ...(current ?? [])]);
    return tokens.map((token) => inviteUrl(lobbyUrl(), token)).join('\n');
  };

  const remove = (token: string) => {
    setLinks((current) => current && current.filter((l) => l.token !== token));
    void deleteInviteAction(code, token)
      .then((deleted) => !deleted && setReload((n) => n + 1))
      .catch(() => setReload((n) => n + 1));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <CopyButton icon="add_link" label={td('newLink')} copy={() => create(1)} disabled={cannotCreate} />
        {/* Empilés sur téléphone : le libellé du bouton tient sur une ligne, quel que soit le nombre. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <NumberField id="invite-batch" label={td('batchCount')} value={count} min={1} max={batchMax} onCommit={setBatch} />
          <div className="min-w-0 flex-1 whitespace-nowrap">
            <CopyButton icon="library_add" label={td('createBatch', { count })} copy={() => create(count)} disabled={cannotCreate} />
          </div>
        </div>
        <Reserve
          active={full ? 'full' : 'note'}
          variants={{
            note: <p className="text-[13px] leading-5 text-outline">{td('copiedNote')}</p>,
            full: <p className="text-[13px] leading-5 text-error">{td('full')}</p>,
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <FieldLabel id="invite-list-title">{td('list')}</FieldLabel>
          <p className="font-label-code text-[12px] text-on-surface-variant">{td('count', { count: links?.length ?? 0, max: MAX_INVITES })}</p>
        </div>
        <div className="h-[min(320px,38dvh)] overflow-y-auto border border-surface-container-highest bg-surface-container-lowest">
          <ul aria-labelledby="invite-list-title">
            {links?.map((link) => <LinkRow key={link.token} link={link} onDelete={() => remove(link.token)} />)}
          </ul>
          {(links === null || links.length === 0) && (
            <p className="px-4 py-5 text-[14px] text-outline">{links ? td('empty') : failed ? td('loadFailed') : td('loading')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkRow({ link, onDelete }: { link: InviteLink; onDelete: () => void }) {
  const td = useTranslations('Lobby.invite.dialog');
  const url = inviteUrl(lobbyUrl(), link.token);
  const status = link.status === 'unused' ? td('status.unused') : td(`status.${link.status}`, { name: link.usedBy ?? '?' });

  return (
    <li className="flex items-center gap-3 border-b border-primary/10 py-2.5 pr-2 pl-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex min-w-0 items-center gap-2 text-[13px] leading-5 text-on-surface">
          <span aria-hidden="true" className={`size-[7px] shrink-0 rounded-full ${STATUS_DOT[link.status]}`} />
          <span className="truncate" title={status}>{status}</span>
        </p>
        <p title={url} className={`font-label-code truncate text-[12px] leading-5 select-all ${link.status === 'unused' ? 'text-on-surface-variant' : 'text-outline'}`}>
          {url}
        </p>
      </div>
      <CopyButton iconOnly icon="content_copy" label={td('copy')} copy={async () => url} bare />
      <button
        type="button"
        onClick={onDelete}
        aria-label={td('delete')}
        title={td('delete')}
        className="grid size-10 shrink-0 place-items-center text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-error"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </li>
  );
}
