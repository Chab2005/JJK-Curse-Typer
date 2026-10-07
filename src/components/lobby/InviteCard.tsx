'use client';

import { useTranslations } from 'next-intl';
import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';
import Reserve from '@/components/shared/Reserve';
import CopyButton from './CopyButton';
import InviteLinksDialog from './InviteLinksDialog';
import { canCopyCode, inviteLinkMode } from './lobbyAccess';
import type { LobbyVisibility } from './lobbyRoom';

// Code du lobby et liens à partager (LOB-3, LOB-4). Seul l'hôte ouvre la fenêtre des liens : l'adresse d'un lobby public,
// ou ses liens à usage unique sinon. Un lobby privé ne montre pas son code.
// La carte garde les mêmes blocs et la même taille quels que soient l'accès et le rôle.
// `refreshKey` change à chaque arrivée ou départ : la fenêtre ouverte recharge alors l'état des liens.
export default function InviteCard({ code, visibility, isHost, refreshKey = '' }: { code: string; visibility: LobbyVisibility; isHost: boolean; refreshKey?: string }) {
  const t = useTranslations('Lobby.invite');
  const mode = inviteLinkMode(visibility, isHost);

  return (
    <BevelFrame frame={cardFrame} className="flex flex-col gap-4 bg-surface-container-low px-6 pt-5 pb-6">
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

      <InviteLinksDialog code={code} mode={mode} refreshKey={refreshKey} />

      <Reserve
        active={mode}
        variants={{
          url: <Note>{t('urlNote')}</Note>,
          oneTime: <Note>{t('oneTime')}</Note>,
          hostOnly: <Note>{t('hostOnly')}</Note>,
        }}
      />
    </BevelFrame>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] leading-5 text-outline">{children}</p>;
}
