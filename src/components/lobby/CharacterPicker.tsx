'use client';

import { useTranslations } from 'next-intl';
import Avatar from '@/components/shared/Avatar';
import BevelPanel from '@/components/shared/BevelPanel';
import { CHARACTERS, type CharacterId } from '@/components/shared/characters';

// Choix du personnage dans le salon (canvas « Lobby (Participant) · Personnage »). Sans choix, la course en tire un, stable, du siège.
export default function CharacterPicker({ value, onPick }: { value: CharacterId | null; onPick: (character: CharacterId) => void }) {
  const t = useTranslations('Lobby.character');

  return (
    <BevelPanel as="section" aria-labelledby="character-title" className="flex flex-col gap-4 px-6 pt-6 pb-7">
      <div className="flex flex-col gap-1">
        <h2 id="character-title" className="text-[22px] uppercase tracking-[0.08em]">{t('title')}</h2>
        <p className="text-[14px] text-outline">{t('hint')}</p>
      </div>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {CHARACTERS.map(({ id, name }) => (
          <li key={id}>
            <button
              type="button"
              aria-pressed={value === id}
              onClick={() => onPick(id)}
              className={`flex min-h-11 w-full flex-col items-center gap-2 border-2 bg-[#110506] px-2 pt-3 pb-2.5 transition-colors hover:border-primary-container/60 ${value === id ? 'border-primary-container' : 'border-transparent'}`}
            >
              <Avatar avatar={id} name={name} size={56} />
              <span className="font-grotesk text-center text-[14px] leading-[18px] text-on-surface">{name}</span>
            </button>
          </li>
        ))}
      </ul>
    </BevelPanel>
  );
}
