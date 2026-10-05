import { useTranslations } from 'next-intl';
import Reserve from '@/components/shared/Reserve';
import type { StartBlocker, ViewerRole } from './lobbyRoom';

// Action principale du salon selon le rôle : lancer la course (hôte), se déclarer prêt (joueur),
// rien pour un spectateur. Le lien pour quitter le lobby est sous les paramètres (<LeaveLobbyLink>).
export default function ReadyPanel({
  role,
  ready,
  blocker,
  onToggleReady,
  onStart,
}: {
  role: ViewerRole;
  ready: boolean;
  blocker: StartBlocker | null;
  onToggleReady: () => void;
  onStart: () => void;
}) {
  const t = useTranslations('Lobby.actions');

  return (
    <div className="flex flex-col gap-3">
      {role === 'host' && (
        <>
          <PrimaryButton icon="swords" disabled={blocker !== null} describedBy={blocker ? 'start-blocker' : undefined} onClick={onStart}>
            {t('start')}
          </PrimaryButton>
          {/* La place de la raison reste réservée : la lever ne fait pas remonter la suite du salon. */}
          <Reserve
            active={blocker ?? 'none'}
            variants={{
              notEnoughPlayers: <Blocker id={blocker === 'notEnoughPlayers' ? 'start-blocker' : undefined}>{t('blockers.notEnoughPlayers')}</Blocker>,
              notReady: <Blocker id={blocker === 'notReady' ? 'start-blocker' : undefined}>{t('blockers.notReady')}</Blocker>,
              none: null,
            }}
          />
        </>
      )}

      {role === 'player' &&
        (ready ? (
          <button
            type="button"
            onClick={onToggleReady}
            className="flex min-h-15 items-center justify-center gap-3 border border-tertiary text-[17px] uppercase tracking-[0.12em] text-tertiary transition-colors hover:bg-tertiary hover:text-on-tertiary"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[22px]">undo</span>
            {t('unready')}
          </button>
        ) : (
          <PrimaryButton icon="check_circle" onClick={onToggleReady}>{t('ready')}</PrimaryButton>
        ))}
      {role === 'player' && <p className="text-[14px] leading-5 text-on-surface-variant">{t('waitHost')}</p>}

      {role === 'spectator' && <p className="text-[14px] leading-5 text-on-surface-variant">{t('spectator')}</p>}
    </div>
  );
}

function Blocker({ id, children }: { id?: string; children: React.ReactNode }) {
  return <p id={id} className="text-[14px] leading-5 text-on-surface-variant">{children}</p>;
}

/** Habillage du bouton principal (cadre doré biseauté), partagé avec le lien pour quitter le lobby. */
export const primaryFrame = 'group bevel flex bg-linear-135 from-gold to-gold-deep p-px transition-transform hover:-translate-y-0.5';
export const primaryFace =
  'bevel flex min-h-15 flex-grow items-center justify-center gap-3 bg-primary-container text-[17px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary';

function PrimaryButton({ icon, disabled, describedBy, onClick, children }: { icon: string; disabled?: boolean; describedBy?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-describedby={describedBy}
      onClick={onClick}
      className={`${primaryFrame} disabled:pointer-events-none disabled:bg-none disabled:bg-outline-variant`}
    >
      <span className={`${primaryFace} group-disabled:bg-surface-container-high group-disabled:text-outline`}>
        <span aria-hidden="true" className="material-symbols-outlined text-[22px]">{icon}</span>
        {children}
      </span>
    </button>
  );
}
