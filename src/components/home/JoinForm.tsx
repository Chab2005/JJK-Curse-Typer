'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { createLobbyAction } from '@/app/actions/lobbies';
import { useRouter } from '@/i18n/navigation';
import { formatPinInput, isCompletePin, normalizePin, pickRandomPseudo } from './join';

const RANDOM_PSEUDOS = [
  'Megumi_Shadows',
  'Yuji_BlackFlash',
  'Nobara_Resonance',
  'Satoru_Infinity',
  'Sukuna_Malevolent',
  'Nanami_Ratio73',
  'Todo_BoogieWoogie',
  'Maki_Heavenly',
];

const DEMO_PIN = '884-JJK';

export default function JoinForm() {
  const t = useTranslations('JoinForm');
  const [roomPin, setRoomPin] = useState('');
  const [exorcistName, setExorcistName] = useState('Megumi_Shadows');
  const [showBanner, setShowBanner] = useState(false);
  const [statusPin, setStatusPin] = useState(DEMO_PIN);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, startCreating] = useTransition();
  const [createFailed, setCreateFailed] = useState(false);
  const router = useRouter();
  // Vide : on retombe sur le code de démo ; sinon il faut un code complet.
  const canSubmit = roomPin === '' || isCompletePin(roomPin);

  const triggerJoinDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Un code complet mène à son lobby (LOB-3) ; la page 404 du lobby gère les codes inconnus.
    if (roomPin !== '') {
      router.push(`/lobby/${normalizePin(roomPin)}`);
      return;
    }

    setStatusPin(normalizePin(roomPin) || DEMO_PIN);
    setShowBanner(true);
    setIsLoading(true);

    // Sans code, on garde la connexion simulée au domaine de démonstration.
    setTimeout(() => {
      setIsLoading(false);
      setShowBanner(false);
    }, 2400);
  };

  // Nouveau lobby privé dont on est l'hôte (LOB-4), créé sur le serveur puis ouvert.
  const createLobby = () => {
    setCreateFailed(false);
    startCreating(async () => {
      try {
        router.push(`/lobby/${await createLobbyAction()}`);
      } catch {
        setCreateFailed(true);
      }
    });
  };

  return (
    <div className="bevel bg-linear-160 from-primary-container via-outline-variant via-40% to-secondary-container p-px">
      <form onSubmit={triggerJoinDomain} className="bevel flex flex-col gap-[22px] bg-surface-container-low px-[34px] pt-9 pb-[30px]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl uppercase tracking-[0.12em]">{t('title')}</h3>
          <p className="font-label-code flex items-center gap-1.5 text-[11px] font-bold uppercase text-tertiary">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-tertiary" />
            {t('serverActive')}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="roomPinInput" className="flex justify-between text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">
            {t('pinLabel')}
            <span className="font-label-code text-[10px] tracking-[0.08em] text-outline">{t('pinExample')}</span>
          </label>
          <input
            id="roomPinInput"
            type="text"
            maxLength={7}
            value={roomPin}
            onChange={(e) => setRoomPin(formatPinInput(e.target.value))}
            placeholder="___-___"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full border border-surface-container-highest bg-surface-container-lowest px-[18px] py-3 text-center text-[38px] font-bold uppercase tracking-[0.24em] text-primary placeholder:text-surface-container-highest"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="exorcistPseudoInput" className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">
              {t('nameLabel')}
            </label>
            <button
              type="button"
              onClick={() => setExorcistName(pickRandomPseudo(exorcistName, RANDOM_PSEUDOS))}
              className="flex min-h-8 items-center gap-1 text-[13px] text-tertiary transition-colors hover:text-on-surface"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[15px]">shuffle</span>
              {t('randomName')}
            </button>
          </div>
          <input
            id="exorcistPseudoInput"
            type="text"
            maxLength={20}
            value={exorcistName}
            onChange={(e) => setExorcistName(e.target.value)}
            placeholder="Megumi_Shadows"
            className="font-grotesk w-full border border-surface-container-highest bg-surface-container-lowest px-[18px] py-[13px] text-xl text-on-surface placeholder:text-surface-container-highest"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !canSubmit}
          className="group bevel flex bg-primary p-px transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-80"
        >
          <span className="bevel flex min-h-15 flex-grow items-center justify-center gap-3 bg-primary-container text-[19px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary">
            <span aria-hidden="true" className="material-symbols-outlined text-[22px]">swords</span>
            {t('submit')}
          </span>
        </button>

        <button
          type="button"
          onClick={createLobby}
          disabled={isCreating}
          className="group flex min-h-8 items-center gap-2 self-center text-sm text-outline transition-colors hover:text-primary disabled:opacity-60"
        >
          <span aria-hidden="true" className={`material-symbols-outlined text-[17px] text-primary ${isCreating ? 'animate-spin' : ''}`}>{isCreating ? 'progress_activity' : 'add'}</span>
          <span className="underline decoration-primary/40 underline-offset-4 group-hover:decoration-primary">{t('createLobby')}</span>
        </button>
        {createFailed && (
          <p role="alert" className="self-center text-[14px] text-error">
            {t('createFailed')}
          </p>
        )}

        {showBanner && (
          <div role="status" className="flex items-center gap-3 bg-surface-container-lowest p-3">
            {isLoading ? (
              <>
                <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[20px] text-primary">refresh</span>
                <p className="font-label-code flex-1 text-label-code text-on-surface">
                  {t.rich('syncing', {
                    pin: statusPin,
                    highlight: (chunks) => <strong className="text-primary">{chunks}</strong>,
                  })}
                </p>
              </>
            ) : (
              <>
                <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-tertiary">check_circle</span>
                <p className="font-label-code flex-1 text-label-code text-on-surface">
                  {t.rich('connected', {
                    pin: statusPin,
                    name: exorcistName,
                    highlight: (chunks) => <strong className="text-tertiary">{chunks}</strong>,
                  })}
                </p>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
