'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { setGuestNameAction } from '@/app/actions/auth';
import { createLobbyAction } from '@/app/actions/lobbies';
import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';
import { useRouter } from '@/i18n/navigation';
import { USERNAME_MAX, USERNAME_MIN, validateUsername } from '@/lib/auth/validation';
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

// `accountName` : pseudo du compte connecté. Sans lui, le visiteur est un invité : il choisit un pseudo de 3 à 20
// caractères avant de rejoindre un lobby, et ne peut pas en créer.
export default function JoinForm({ accountName = null }: { accountName?: string | null }) {
  const t = useTranslations('JoinForm');
  const [roomPin, setRoomPin] = useState('');
  const [exorcistName, setExorcistName] = useState(accountName ?? 'Megumi_Shadows');
  const [nameError, setNameError] = useState<'length' | 'characters' | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [statusPin, setStatusPin] = useState(DEMO_PIN);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, startCreating] = useTransition();
  const [createFailed, setCreateFailed] = useState(false);
  const router = useRouter();
  // Vide : on retombe sur le code de démo ; sinon il faut un code complet.
  const canSubmit = roomPin === '' || isCompletePin(roomPin);

  const triggerJoinDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Un invité doit avoir un pseudo valide avant d'entrer dans un lobby, mémorisé dans son cookie signé de session.
    if (!accountName) {
      const invalid = validateUsername(exorcistName) ?? (await setGuestNameAction(exorcistName.trim()));
      if (invalid) {
        setNameError(invalid === 'account' ? null : invalid);
        return;
      }
    }
    setNameError(null);

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
    // Seul un compte peut héberger : un invité passe d'abord par la connexion.
    if (!accountName) {
      router.push('/login');
      return;
    }
    setCreateFailed(false);
    startCreating(async () => {
      try {
        const code = await createLobbyAction();
        router.push(code ? `/lobby/${code}` : '/login');
      } catch {
        setCreateFailed(true);
      }
    });
  };

  return (
    <BevelFrame as="form" onSubmit={triggerJoinDomain} frame={cardFrame} className="flex flex-col gap-[22px] bg-surface-container-low px-[34px] pt-9 pb-[30px]">
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
          {!accountName && (
            <button
              type="button"
              onClick={() => setExorcistName(pickRandomPseudo(exorcistName, RANDOM_PSEUDOS))}
              className="flex min-h-8 items-center gap-1 text-[13px] text-tertiary transition-colors hover:text-on-surface"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[15px]">shuffle</span>
              {t('randomName')}
            </button>
          )}
        </div>
        <input
          id="exorcistPseudoInput"
          type="text"
          maxLength={USERNAME_MAX}
          value={exorcistName}
          readOnly={Boolean(accountName)}
          onChange={(e) => setExorcistName(e.target.value)}
          aria-invalid={nameError !== null}
          aria-describedby={nameError ? 'exorcistPseudoError' : undefined}
          placeholder="Megumi_Shadows"
          className="font-grotesk w-full border aria-invalid:border-error border-surface-container-highest bg-surface-container-lowest px-[18px] py-[13px] text-xl text-on-surface placeholder:text-surface-container-highest"
        />
      </div>

      {nameError && (
        <p id="exorcistPseudoError" role="alert" className="-mt-3 text-[14px] text-error">
          {t(`nameError.${nameError}`, { min: USERNAME_MIN, max: USERNAME_MAX })}
        </p>
      )}

      <BevelFrame
        as="button"
        type="submit"
        disabled={isLoading || !canSubmit}
        frame="group flex bg-primary transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-80"
        className="flex min-h-15 flex-grow items-center justify-center gap-3 bg-primary-container text-[19px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[22px]">swords</span>
        {t('submit')}
      </BevelFrame>

      {/* Masqué sur téléphone (sous `sm`) : la création de lobby ne s'y propose pas. */}
      <button
        type="button"
        onClick={createLobby}
        disabled={isCreating}
        className="group hidden min-h-8 items-center gap-2 self-center sm:flex text-sm text-outline transition-colors hover:text-primary disabled:opacity-60"
      >
        <span aria-hidden="true" className={`material-symbols-outlined text-[17px] text-primary ${isCreating ? 'animate-spin' : ''}`}>{isCreating ? 'progress_activity' : 'add'}</span>
        <span className="underline decoration-primary/40 underline-offset-4 group-hover:decoration-primary">{accountName ? t('createLobby') : t('createLobbyGuest')}</span>
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
    </BevelFrame>
  );
}
