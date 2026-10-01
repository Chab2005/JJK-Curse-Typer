'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

const RANDOM_PSEUDOS = [
  'Megumi_Shadows',
  'Yuji_BlackFlash',
  'Nobara_Resonance',
  'Satoru_Infinity',
  'Sukuna_Malevolent',
  'Nanami_Ratio73',
  'Todo_BoogieWoogie',
  'Maki_Heavenly'
];

export default function JoinForm() {
  const t = useTranslations('JoinForm');
  const [roomPin, setRoomPin] = useState('');
  const [exorcistName, setExorcistName] = useState('Megumi_Shadows');
  const [showBanner, setShowBanner] = useState(false);
  const [statusPin, setStatusPin] = useState('884-JJK');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const input = document.getElementById('roomPinInput') as HTMLInputElement;
    if (input) input.focus();
  }, []);

  const randomizePseudo = () => {
    const filtered = RANDOM_PSEUDOS.filter(p => p !== exorcistName);
    const next = filtered[Math.floor(Math.random() * filtered.length)];
    setExorcistName(next);
  };

  const triggerJoinDomain = (e: React.FormEvent) => {
    e.preventDefault();

    const code = roomPin.trim().toUpperCase() || '884-JJK';
    setStatusPin(code);
    setShowBanner(true);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setShowBanner(false);
    }, 2400);
  };

  return (
    <div className="lg:col-span-7 flex flex-col">
      <div className="relative bg-surface-container rounded-xl p-space-md lg:p-space-xl shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-secondary-container to-tertiary"></div>

        <div className="flex items-center justify-between pb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span className="font-headline-sm text-label-code uppercase tracking-wider text-on-surface-variant">
              {t('connection')}
            </span>
          </div>
          <div className="flex items-center gap-1 font-label-code text-talisman-tag text-tertiary">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span>{t('serverActive')}</span>
          </div>
        </div>

        <form onSubmit={triggerJoinDomain} className="mt-space-md flex flex-col gap-space-lg">
          {/* Room PIN Input */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label
                htmlFor="roomPinInput"
                className="font-headline-sm text-label-code uppercase tracking-wider text-on-surface flex items-center gap-space-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">pin</span>
                <span>{t('pinLabel')}</span>
              </label>
              <span className="font-label-code text-talisman-tag text-outline">{t('pinFormat')}</span>
            </div>
            <div className="relative flex items-center">
              <input
                id="roomPinInput"
                type="text"
                maxLength={7}
                value={roomPin}
                onChange={(e) => setRoomPin(e.target.value)}
                placeholder=" "
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-surface-container-lowest text-primary font-headline-lg text-headline-lg lg:text-hud-metric uppercase tracking-widest px-space-md py-space-sm rounded-lg placeholder:text-surface-container-highest focus:outline-none shadow-inner"
              />
              <div className="absolute right-space-md flex items-center gap-space-xs pointer-events-none">
                <span className="w-2.5 h-8 bg-primary animate-pulse rounded"></span>
                <span className="font-talisman-tag text-talisman-tag text-outline uppercase hidden sm:inline">
                  {t('liveCursor')}
                </span>
              </div>
            </div>
          </div>

          {/* Exorcist Name Input */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label
                htmlFor="exorcistPseudoInput"
                className="font-headline-sm text-label-code uppercase tracking-wider text-on-surface flex items-center gap-space-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-tertiary">badge</span>
                <span>{t('nameLabel')}</span>
              </label>
              <button
                onClick={randomizePseudo}
                type="button"
                className="font-label-code text-talisman-tag text-tertiary hover:text-on-surface transition-colors flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">shuffle</span>
                <span>{t('randomName')}</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-space-md flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <input
                id="exorcistPseudoInput"
                type="text"
                maxLength={20}
                value={exorcistName}
                onChange={(e) => setExorcistName(e.target.value)}
                placeholder="Megumi_Shadows"
                className="w-full bg-surface-container-low text-on-surface font-headline-sm text-headline-sm pl-11 pr-space-md py-space-sm rounded-lg placeholder:text-surface-container-highest focus:outline-none"
              />
              <div className="absolute right-space-md flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-tertiary">verified</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col gap-space-sm pt-space-xs">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full bg-primary-container hover:bg-inverse-primary disabled:opacity-80 disabled:pointer-events-none text-on-primary-container font-headline-sm text-headline-sm uppercase tracking-wider py-space-md rounded-xl transition-all shadow-lg flex items-center justify-center gap-space-md active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[26px] group-hover:rotate-45 transition-transform">
                swords
              </span>
              <span>{t('submit')}</span>
              <kbd className="hidden sm:inline-flex items-center px-space-xs py-0.5 bg-on-primary-container/20 text-on-primary-container rounded font-label-code text-label-code">
                {t('enterKey')}
              </kbd>
            </button>

            {/* Create Room Link */}
            <div className="flex items-center justify-between text-outline font-label-code text-label-code pt-space-xs">
              <button
                type="button"
                className="hover:text-primary transition-colors flex items-center gap-space-xs group"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">add_circle</span>
                <span className="underline underline-offset-4 decoration-primary/40 group-hover:decoration-primary">
                  {t('createPrivate')}
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* Status Banner */}
        {showBanner && (
          <div className="mt-space-md p-space-sm bg-surface-container-lowest rounded-lg flex items-center gap-space-sm">
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-primary text-[20px] animate-spin">refresh</span>
                <p className="font-label-code text-label-code text-on-surface flex-1">
                  {t.rich('syncing', {
                    pin: statusPin,
                    highlight: (chunks) => <span className="text-primary font-bold">{chunks}</span>,
                  })}
                </p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
                <p className="font-label-code text-label-code text-on-surface flex-1">
                  {t.rich('connected', {
                    pin: statusPin,
                    name: exorcistName,
                    highlight: (chunks) => <span className="text-tertiary font-bold">{chunks}</span>,
                  })}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
