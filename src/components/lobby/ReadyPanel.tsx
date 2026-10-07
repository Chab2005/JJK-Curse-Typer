import { useTranslations } from 'next-intl';
import BevelFrame, { goldFrame } from '@/components/shared/BevelFrame';
import Reserve from '@/components/shared/Reserve';
import type { StartBlocker, ViewerRole } from './lobbyRoom';

// Action principale du salon selon le rôle : lancer la course (hôte), se déclarer prêt (joueur),
// rien pour un spectateur. Dessous, chacun peut passer spectateur ou revenir dans la course (`spectating`, `null` hors du salon).
// Joueur et spectateur sont superposés (<Reserve>) : changer de rôle ne déplace pas la suite du salon.
// Le lien pour quitter le lobby est sous les paramètres (<LeaveLobbyLink>).
export default function ReadyPanel({
  role,
  ready,
  blocker,
  racing = false,
  spectating = null,
  canPlay = true,
  onToggleReady,
  onStart,
  onToggleSpectating = () => {},
}: {
  role: ViewerRole;
  ready: boolean;
  blocker: StartBlocker | null;
  racing?: boolean;
  spectating?: boolean | null;
  /** Il reste une place de joueur pour un spectateur. */
  canPlay?: boolean;
  onToggleReady: () => void;
  onStart: () => void;
  onToggleSpectating?: () => void;
}) {
  const t = useTranslations('Lobby.actions');
  const tSpectating = useTranslations('Lobby.spectating');

  return (
    <div className="flex flex-col gap-3">
      {role === 'host' ? (
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
      ) : (
        <Reserve
          active={role}
          variants={{
            player: (
              <div className="flex flex-col gap-3">
                {ready ? (
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
                )}
                <p className="text-[14px] leading-5 text-on-surface-variant">{t('waitHost')}</p>
              </div>
            ),
            spectator: (
              <section aria-labelledby="spectating-title" className="flex items-start gap-4 border-l-[3px] border-secondary bg-secondary-container/20 px-5 py-4">
                <span aria-hidden="true" className="material-symbols-outlined text-[26px] text-secondary">visibility</span>
                <div className="flex flex-col gap-1">
                  <h2 id="spectating-title" className="text-[15px] uppercase tracking-[0.14em] text-on-surface">{tSpectating('title')}</h2>
                  <p className="text-on-surface-variant">{tSpectating(racing ? 'racing' : 'waiting')}</p>
                  <p className="text-[14px] leading-5 text-on-surface-variant">{t('spectator')}</p>
                </div>
              </section>
            ),
          }}
        />
      )}

      {spectating !== null && !racing && (
        <button
          type="button"
          onClick={onToggleSpectating}
          disabled={spectating && !canPlay}
          title={spectating && !canPlay ? t('full') : undefined}
          className="flex min-h-11 items-center justify-center gap-2 border border-surface-container-highest px-4 text-[13px] uppercase tracking-[0.12em] text-on-surface transition-colors enabled:hover:border-secondary enabled:hover:text-secondary disabled:cursor-not-allowed disabled:text-outline"
        >
          <Reserve
            active={spectating ? 'play' : 'spectate'}
            variants={{
              spectate: <Label icon="visibility">{t('spectate')}</Label>,
              play: <Label icon="sports_esports">{t('play')}</Label>,
            }}
          />
        </button>
      )}
    </div>
  );
}

function Label({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">{icon}</span>
      {children}
    </span>
  );
}

function Blocker({ id, children }: { id?: string; children: React.ReactNode }) {
  return <p id={id} className="text-[14px] leading-5 text-on-surface-variant">{children}</p>;
}

/** Habillage du bouton principal (cadre doré biseauté), partagé avec le lien pour quitter le lobby. */
export const primaryFrame = `group flex ${goldFrame} transition-transform hover:-translate-y-0.5`;
export const primaryFace =
  'flex min-h-15 flex-grow items-center justify-center gap-3 bg-primary-container text-[17px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary';

function PrimaryButton({ icon, disabled, describedBy, onClick, children }: { icon: string; disabled?: boolean; describedBy?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <BevelFrame
      as="button"
      type="button"
      disabled={disabled}
      aria-describedby={describedBy}
      onClick={onClick}
      frame={`${primaryFrame} disabled:pointer-events-none disabled:bg-none disabled:bg-outline-variant`}
      className={`${primaryFace} group-disabled:bg-surface-container-high group-disabled:text-outline`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[22px]">{icon}</span>
      {children}
    </BevelFrame>
  );
}
