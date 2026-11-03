'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import SpearArrow from '@/components/shared/SpearArrow';
import TechniqueExample, { type ShowcaseProps } from './TechniqueExample';
import { SHOWCASE_ABILITIES, type ShowcaseCharacter } from './techniqueDemo';

const ARROW = 'group absolute top-1/2 z-30 -translate-y-1/2 p-1 text-primary-container focus-visible:outline-2 focus-visible:outline-primary';
const SPEAR = 'block h-12 w-4 transition-[translate,filter] duration-300 group-hover:brightness-140 motion-reduce:transition-none';

// Vitrine de Yuji ou Nobara : une capacité à la fois, des flèches de chaque côté pour passer à l'autre.
export default function AbilityShowcase({ character }: { character: ShowcaseCharacter }) {
  const t = useTranslations('Character.example');
  const abilities = SHOWCASE_ABILITIES[character];
  const [index, setIndex] = useState(0);
  const step = (delta: number) => setIndex((i) => (i + delta + abilities.length) % abilities.length);
  const example = { character, ability: abilities[index] } as ShowcaseProps;

  return (
    <div className="relative">
      <TechniqueExample key={example.ability} {...example} />
      <button type="button" aria-label={t('previousAbility')} onClick={() => step(-1)} className={`${ARROW} -left-6`}>
        <SpearArrow headOnly direction="left" className={`${SPEAR} group-hover:-translate-x-1`} />
      </button>
      <button type="button" aria-label={t('nextAbility')} onClick={() => step(1)} className={`${ARROW} -right-6`}>
        <SpearArrow headOnly direction="right" className={`${SPEAR} group-hover:translate-x-1`} />
      </button>
    </div>
  );
}
