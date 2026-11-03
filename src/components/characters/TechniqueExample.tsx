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
import { EXAMPLE_MS, EXAMPLE_PHASES, exampleRunners, nextPhase, type ExampleCharacter, type ExamplePhase } from './techniqueDemo';

/** Taille des personnages sur la piste, en fraction du fichier. */
const SCALE = 0.17;
/** Place gardée de chaque côté de la piste : le personnage arrivé reste avant la ligne. */
const EDGE = 36;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const subscribeToMotion = (onChange: () => void) => {
  const query = window.matchMedia?.(REDUCED_MOTION);
  query?.addEventListener?.('change', onChange);
  return () => query?.removeEventListener?.('change', onChange);
};
const prefersReducedMotion = () => window.matchMedia?.(REDUCED_MOTION).matches ?? false;

// Exemple en course de la technique d'un personnage (fiche /characters/<id>) : une piste miniature en boucle où il est
// en retrait, lance sa technique (Alt + W, puis son nom), puis a échangé sa place avec le meneur. Les trois temps sont
// aussi écrits en toutes lettres (UI-8) ; quand l'utilisateur demande moins d'animations (UI-7), la piste reste sur le résultat.
export default function TechniqueExample({ character }: { character: ExampleCharacter }) {
  const t = useTranslations('Character.example');
  const techniques = useTranslations('Characters.techniques');
  const reducedMotion = useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => false);
  const [looping, setLooping] = useState<ExamplePhase>('before');
  const phase = reducedMotion ? 'after' : looping;

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(() => setLooping(nextPhase(looping)), EXAMPLE_MS[looping]);
    return () => clearTimeout(timer);
  }, [looping, reducedMotion]);

  const runners = exampleRunners(character, phase);
  const style = CHARACTER_STYLES[character];
  const rivalName = (id: CharacterId) => (CHARACTERS.find((c) => c.id === id)?.name ?? id).split(' ')[0];

  return (
    <BevelFrame frame={cardFrame} className="flex flex-col gap-3.5 bg-surface px-6 py-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-label-code text-[11px] font-bold uppercase tracking-[0.24em] text-outline">{t('title')}</h2>
        <p className="font-label-code text-[11px] uppercase tracking-[0.16em] text-outline">
          {t('step', { step: EXAMPLE_PHASES.indexOf(phase) + 1, steps: EXAMPLE_PHASES.length })}
        </p>
      </div>

      <div role="img" aria-label={t(`${character}.track`)} data-testid="technique-example" data-phase={phase} className="relative h-[118px] overflow-hidden border border-surface-container-high bg-surface-container-lowest">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-7 h-0.5 bg-linear-to-r from-transparent via-[#8f1022] via-15% to-primary-container" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-5 h-2.5 bg-[repeating-linear-gradient(90deg,rgb(225_29_72/0.35)_0_1px,transparent_1px_10%)]" />
        <div aria-hidden="true" className="absolute top-2 right-1.5 bottom-3 w-2 bg-[repeating-conic-gradient(#fffaf9_0_25%,#6e0718_0_50%)] bg-[length:8px_10px]" />

        {runners.map((runner) => {
          const you = runner.id === 'you';
          return (
            <div
              key={runner.id}
              aria-hidden="true"
              className="absolute bottom-[22px] flex -translate-x-1/2 flex-col items-center gap-1"
              style={{ left: `calc(${EDGE}px + ${runner.x} * (100% - ${EDGE * 2}px))`, zIndex: you ? 20 : 10 }}
            >
              <TodoSwapEffect
                active={!reducedMotion && phase !== 'before'}
                bodyWidth={Math.round(SPRITES[runner.character].idle.w * SCALE)}
                width={Math.round(Math.max(SPRITES[runner.character].idle.w, SPRITES[runner.character].running.w) * SCALE)}
                height={Math.round(Math.max(SPRITES[runner.character].idle.h, SPRITES[runner.character].running.h) * SCALE)}
              >
                <span className="relative z-10 block" style={spriteStyle(runner.character, phase === 'after' ? 'running' : 'idle', SCALE)} />
                <span className={`absolute -bottom-[3px] left-1/2 h-1.5 w-9 -translate-x-1/2 rounded-[50%] ${you ? 'bg-primary-container/55' : 'bg-black/60'}`} />
              </TodoSwapEffect>
              <span className={`font-label-code relative z-10 px-1.5 text-[10px] font-bold tracking-[0.12em] uppercase ${you ? `bg-primary-container text-on-primary-container` : 'text-outline'}`}>
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
          before: <p className="text-base leading-[25px]">{t(`${character}.before`, { rival: rivalName(exampleRunners(character, 'before')[1].character) })}</p>,
          cast: (
            <div className="flex flex-col gap-2.5 text-base leading-[25px]">
              <p>{t(`${character}.cast`)}</p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-on-surface-variant">
                <Shortcut ability="technique" />
                <span className={`font-label-code ${style.ink}`}>« {techniques(character)} »</span>
              </p>
            </div>
          ),
          after: <p className="text-base leading-[25px]">{t(`${character}.after`, { rival: rivalName(exampleRunners(character, 'before')[1].character) })}</p>,
        }}
      />
    </BevelFrame>
  );
}
