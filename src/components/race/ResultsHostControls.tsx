'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import ChevronButton from '@/components/shared/ChevronButton';
import Reserve from '@/components/shared/Reserve';
import ConfirmDialog from './ConfirmDialog';

// Suite d'une course d'un salon créé, sur l'écran des résultats (COURSE-11). L'hôte relance (retour au salon d'attente,
// mêmes participants, réglages modifiables) ou ferme le salon, après confirmation. Les autres attendent son choix ou
// partent. Les deux variantes partagent la même case (`Reserve`) : si l'hôte change, rien ne bouge autour.
export default function ResultsHostControls({
  isHost,
  onRestart,
  onClose,
  onLeave,
}: {
  isHost: boolean;
  onRestart: () => void;
  onClose: () => void;
  onLeave: () => void;
}) {
  const t = useTranslations('Race.hostControls');
  const [confirming, setConfirming] = useState(false);
  // Un seul choix : les boutons se désactivent le temps que le serveur réponde.
  const [busy, setBusy] = useState(false);
  const button = 'text-[15px] uppercase tracking-[0.12em]';

  const choose = (action: () => void) => {
    setBusy(true);
    action();
  };

  return (
    <section aria-label={t('label')}>
      <Reserve
        active={isHost ? 'host' : 'guest'}
        variants={{
          host: (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <ChevronButton type="button" variant="primary" disabled={busy} onClick={() => choose(onRestart)} className={button}>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">replay</span>
                {t('restart')}
              </ChevronButton>
              <ChevronButton type="button" disabled={busy} onClick={() => setConfirming(true)} className={button}>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">door_front</span>
                {t('close')}
              </ChevronButton>
            </div>
          ),
          guest: (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <p role="status" className="flex min-h-14 items-center gap-2 text-on-surface-variant">
                <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[18px] text-tertiary [animation-duration:2s]">progress_activity</span>
                {t('waiting')}
              </p>
              <ChevronButton type="button" disabled={busy} onClick={() => choose(onLeave)} className={button}>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">logout</span>
                {t('leave')}
              </ChevronButton>
            </div>
          ),
        }}
      />
      <ConfirmDialog
        open={confirming}
        title={t('confirmTitle')}
        body={t('confirmBody')}
        confirmLabel={t('confirmClose')}
        cancelLabel={t('cancel')}
        icon="door_front"
        onConfirm={() => {
          setConfirming(false);
          choose(onClose);
        }}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}
