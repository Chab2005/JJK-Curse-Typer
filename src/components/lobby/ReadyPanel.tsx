import { useTranslations } from 'next-intl';
import Reserve from '@/components/shared/Reserve';
import { Link } from '@/i18n/navigation';
import type { StartBlocker, ViewerRole } from './lobbyRoom';

// Action principale du salon selon le rôle : lancer la course (hôte), se déclarer prêt (joueur),
// rien pour un spectateur ; et le lien pour quitter le lobby.
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

      <Link href="/lobbies" className="group flex min-h-10 items-center gap-2 self-start text-sm text-outline transition-colors hover:text-primary">
        <span aria-hidden="true" className="material-symbols-outlined text-[17px] text-primary">arrow_back</span>
        <span className="underline decoration-primary/40 underline-offset-4 group-hover:decoration-primary">{t('leave')}</span>
      </Link>
    </div>
  );
}

function Blocker({ id, children }: { id?: string; children: React.ReactNode }) {
  return <p id={id} className="text-[14px] leading-5 text-on-surface-variant">{children}</p>;
}

function PrimaryButton({ icon, disabled, describedBy, onClick, children }: { icon: string; disabled?: boolean; describedBy?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-describedby={describedBy}
      onClick={onClick}
      className="group bevel flex bg-linear-135 from-gold to-gold-deep p-px transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:bg-none disabled:bg-outline-variant"
    >
      <span className="bevel flex min-h-15 flex-grow items-center justify-center gap-3 bg-primary-container text-[17px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary group-disabled:bg-surface-container-high group-disabled:text-outline">
        <span aria-hidden="true" className="material-symbols-outlined text-[22px]">{icon}</span>
        {children}
      </span>
    </button>
  );
}
