'use client';

import { useTranslations } from 'next-intl';
import { useRef, type ReactNode } from 'react';
import { spriteStyle } from '@/components/characters/characterSprites';
import BevelPanel from '@/components/shared/BevelPanel';
import ChevronButton from '@/components/shared/ChevronButton';
import { CHARACTERS, DEFAULT_CHARACTER, type CharacterId } from '@/components/shared/characters';
import Reserve from '@/components/shared/Reserve';

/** Taille des personnages, dans le bloc et dans les cases de la fenêtre de choix, en fraction du fichier. */
const SPRITE_SCALE = 0.27;

// Exorciste du joueur, au-dessus de la liste des participants (canvas « Lobby · style cramoisi ») : son sprite, ce qu'il sait faire,
// et un bouton qui ouvre le choix. Chacun part avec le personnage de base.
// Toutes les descriptions sont superposées (<Reserve>) : changer d'exorciste ne déplace pas la liste en dessous.
export default function CharacterPicker({ value, onPick }: { value: CharacterId | null; onPick: (character: CharacterId) => void }) {
  const t = useTranslations('Lobby.character');
  const tDetails = useTranslations('Character.techniqueDetails');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = value ?? DEFAULT_CHARACTER;
  const chosen = CHARACTERS.find(({ id }) => id === current)!;
  const close = () => dialogRef.current?.close();

  const details = Object.fromEntries(CHARACTERS.map(({ id }) => [id, <p key={id} className="text-[16px] leading-6 text-on-surface-variant">{tDetails(id)}</p>])) as Record<CharacterId, ReactNode>;

  return (
    <>
      <section aria-labelledby="character-title" className="flex flex-col gap-3 border-b border-[#8f1022]/60 pb-6">
        <h2 id="character-title" className="font-label-code text-[11px] font-bold uppercase tracking-[0.2em] text-primary-container">{t('title')}</h2>

        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="flex h-[90px] w-16 shrink-0 items-end justify-center">
          <span data-testid="exorcist-sprite" className="block motion-reduce:[animation:none]!" style={spriteStyle(current, 'idle', SPRITE_SCALE)} />
        </span>
          <p className="font-grotesk min-w-0 flex-1 text-[22px] leading-7 font-semibold">{chosen.name}</p>
          <ChevronButton type="button" size="sm" chevrons={false} aria-haspopup="dialog" onClick={() => dialogRef.current?.showModal()} className="font-label-code text-[11px] uppercase tracking-[0.16em]">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">person_search</span>
            {t('change')}
          </ChevronButton>
        </div>

        <Reserve active={current} variants={details} />
      </section>

      {/* <dialog> natif, comme les paramètres : focus piégé, Échap ou clic à côté pour fermer, retour du focus sur le bouton. */}
      <dialog
        ref={dialogRef}
        aria-labelledby="character-dialog-title"
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto w-[min(calc(100vw-32px),640px)] overflow-clip bg-transparent p-0 text-on-surface backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <BevelPanel frame="max-h-[calc(100dvh-112px)]" className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-[#8f1022]/60 px-6 pt-6 pb-4 sm:px-8">
            <h2 id="character-dialog-title" className="text-[26px] uppercase tracking-[0.08em]">{t('modalTitle')}</h2>
            <button type="button" onClick={close} aria-label={t('close')} className="flex size-10 items-center justify-center text-on-surface-variant transition-colors hover:text-primary">
              <span aria-hidden="true" className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
          <ul className="grid min-h-0 grid-cols-2 gap-2.5 overflow-y-auto px-6 pt-5 pb-7 sm:grid-cols-4 sm:px-8">
            {CHARACTERS.map(({ id, name }) => (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={current === id}
                  onClick={() => {
                    onPick(id);
                    close();
                  }}
                  className={`flex aspect-square w-full flex-col items-center justify-center gap-1.5 border-2 bg-[#110506] transition-colors hover:border-primary-container/60 ${current === id ? 'border-primary-container' : 'border-transparent'}`}
                >
                  <span aria-hidden="true" className="flex h-[90px] items-end">
                    <span className="block motion-reduce:[animation:none]!" style={spriteStyle(id, 'idle', SPRITE_SCALE)} />
                  </span>
                  <span className="font-grotesk text-[14px] leading-[18px] text-on-surface">{name.split(' ')[0]}</span>
                </button>
              </li>
            ))}
          </ul>
        </BevelPanel>
      </dialog>
    </>
  );
}
