'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useSyncExternalStore } from 'react';
import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';
import Reserve from '@/components/shared/Reserve';
import { CHARACTERS, type CharacterId } from '@/components/shared/characters';
import { SPRITES, spriteStyle } from './characterSprites';
import { CHARACTER_STYLES } from './characterStyles';
import Shortcut from './Shortcut';
import TodoSwapEffect from './TodoSwapEffect';
import type { AbilityKey } from './characterAbilities';
import NobaraTechniqueEffect from './NobaraTechniqueEffect';
import { EXAMPLE_MS, EXAMPLE_PHASES, exampleRunners, nextPhase, type ExamplePhase, type ShowcaseAbility, type ShowcaseCharacter } from './techniqueDemo';
import YujiTechniqueEffect from './YujiTechniqueEffect';
import styles from './TechniqueExample.module.css';

/** Taille des personnages sur la piste, en fraction du fichier. */
const SCALE = 0.34;
/** Place gardée de chaque côté de la piste : le personnage arrivé reste avant la ligne. */
const EDGE = 36;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const subscribeToMotion = (onChange: () => void) => {
  const query = window.matchMedia?.(REDUCED_MOTION);
  query?.addEventListener?.('change', onChange);
  return () => query?.removeEventListener?.('change', onChange);
};
const prefersReducedMotion = () => window.matchMedia?.(REDUCED_MOTION).matches ?? false;

// Piste miniature en trois temps, avec légendes stables (UI-8) et résultat statique en mouvement réduit (UI-7).
export type ShowcaseProps = { [C in ShowcaseCharacter]: { character: C; ability: ShowcaseAbility<C> } }[ShowcaseCharacter];
type Props = { character: 'todo'; ability?: never } | ShowcaseProps;
/** Clé des messages d'un exemple, sous Character.example. */
type ExampleKey = 'todo' | { [C in ShowcaseCharacter]: `${C}.${ShowcaseAbility<C>}` }[ShowcaseCharacter];
export default function TechniqueExample({ character, ability }: Props) {
  const t = useTranslations('Character.example');
  const techniques = useTranslations('Characters.techniques');
  const abilities = useTranslations('Character.abilities');
  const reducedMotion = useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => false);
  const [looping, setLooping] = useState<ExamplePhase>('before');
  const phase = reducedMotion ? 'after' : looping;

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(() => setLooping(nextPhase(looping)), EXAMPLE_MS[looping]);
    return () => clearTimeout(timer);
  }, [looping, reducedMotion]);

  const runners = exampleRunners(character, phase, ability);
  const messageKey = (character === 'todo' ? character : `${character}.${ability}`) as ExampleKey;
  const techniqueName = character === 'todo' ? techniques(character) : abilities(`${`${character}.items.${ability}` as AbilityKey}.name`);
  const style = CHARACTER_STYLES[character];
  const body = 'text-lg leading-7';
  const rivalName = (id: CharacterId) => (CHARACTERS.find((c) => c.id === id)?.name ?? id).split(' ')[0];

  return (
    <BevelFrame frame={cardFrame} className="flex flex-col gap-3.5 bg-surface px-6 py-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`font-label-code font-bold uppercase tracking-[0.24em] text-outline text-sm`}>{t('title')}{ability && <> · <span className={style.ink}>{techniqueName}</span></>}</h2>
        <p className="font-label-code uppercase tracking-[0.16em] text-outline text-[13px]">
          {t('step', { step: EXAMPLE_PHASES.indexOf(phase) + 1, steps: EXAMPLE_PHASES.length })}
        </p>
      </div>

      <div role="img" aria-label={t(`${messageKey}.track`)} data-testid="technique-example" data-phase={phase} className={`relative overflow-hidden border border-surface-container-high bg-surface-container-lowest h-[250px]`}>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-7 h-0.5 bg-linear-to-r from-transparent via-[#8f1022] via-15% to-primary-container" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-5 h-2.5 bg-[repeating-linear-gradient(90deg,rgb(225_29_72/0.35)_0_1px,transparent_1px_10%)]" />
        <div aria-hidden="true" className="absolute top-2 right-1.5 bottom-3 w-2 bg-[repeating-conic-gradient(#fffaf9_0_25%,#6e0718_0_50%)] bg-[length:8px_10px]" />
        {character === 'yuji' && <YujiTechniqueEffect ability={ability} phase={phase} reducedMotion={reducedMotion} />}
        {character === 'nobara' && <NobaraTechniqueEffect ability={ability} phase={phase} reducedMotion={reducedMotion} />}

        {runners.map((runner) => {
          const you = runner.id === 'you';
          const stunned = (ability === 'blackFlash' || ability === 'resonance') && !you && phase === 'after';
          const sprite = (
            <>
              <span className="relative z-10 block" style={{ ...spriteStyle(runner.character, phase === 'after' && !stunned ? 'running' : 'idle', SCALE), ...(stunned || reducedMotion ? { animation: 'none' } : {}) }} />
              <span className={`absolute -bottom-[3px] left-1/2 h-1.5 w-9 -translate-x-1/2 rounded-[50%] ${you ? 'bg-primary-container/55' : 'bg-black/60'}`} />
            </>
          );
          return (
            <div
              key={runner.id}
              aria-hidden="true"
              className={`absolute bottom-[22px] flex -translate-x-1/2 flex-col items-center gap-1 ${ability && phase === 'after' ? styles.advance : ''}`}
              style={{ left: `calc(${EDGE}px + ${runner.x} * (100% - ${EDGE * 2}px))`, zIndex: you ? 20 : 10 }}
            >
              {character === 'todo' ? <TodoSwapEffect
                active={!reducedMotion && phase !== 'before'}
                bodyWidth={Math.round(SPRITES[runner.character].idle.w * SCALE)}
                width={Math.round(Math.max(SPRITES[runner.character].idle.w, SPRITES[runner.character].running.w) * SCALE)}
                height={Math.round(Math.max(SPRITES[runner.character].idle.h, SPRITES[runner.character].running.h) * SCALE)}
              >
                {sprite}
              </TodoSwapEffect> : <span className="relative block">{sprite}</span>}
              <span className={`font-label-code relative z-10 px-1.5 text-[13px] font-bold tracking-[0.12em] uppercase ${you ? `bg-primary-container text-on-primary-container` : 'text-outline'}`}>
                {you ? t('you') : rivalName(runner.character)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Trois textes superposés : la légende change sans que la carte ne bouge. */}
      <Reserve
        active={phase}
        variants={{
          before: <p className={body}>{t(`${messageKey}.before`, { rival: rivalName(exampleRunners(character, 'before')[1].character) })}</p>,
          cast: (
            <div className={`flex flex-col gap-2.5 ${body}`}>
              <p>{t(`${messageKey}.cast`)}</p>
              <p className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-on-surface-variant text-base`}>
                <Shortcut ability="technique" />
                <span className={`font-label-code ${style.ink}`}>« {techniqueName} »</span>
              </p>
            </div>
          ),
          after: <p className={body}>{t(`${messageKey}.after`, { rival: rivalName(exampleRunners(character, 'before')[1].character) })}</p>,
        }}
      />
    </BevelFrame>
  );
}
