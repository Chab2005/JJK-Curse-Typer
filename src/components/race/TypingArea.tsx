'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Ability } from '@/game/abilities';
import { BACKSPACE } from '@/game/typing';
import { shortcutAbility } from './abilityShortcut';
import { type CharState, charState, splitWords } from './raceView';

/** Hauteur d'une ligne de texte (text-typing-stream) : trois lignes visibles à la fois. */
const LINE_HEIGHT = 52;

/** Saisies insérées d'un bloc, jamais tapées (COURSE-04). */
const BLOCKED_INPUT_TYPES: ReadonlySet<string> = new Set(['insertFromPaste', 'insertFromDrop', 'insertFromYank', 'insertFromPasteAsQuotation']);

const CHAR_STYLE: Record<CharState, string> = {
  correct: 'text-on-surface',
  // Une faute est soulignée et surlignée, pas seulement colorée (UI-8).
  wrong: 'text-error bg-error-container/45 underline decoration-error decoration-2 underline-offset-[10px]',
  pending: 'text-outline',
};

// Zone où le joueur tape (maquette « Course ») : le texte, l'état de chaque caractère et le curseur.
// Un champ invisible posé sur le texte capte la frappe, accents composés compris. Il garde le focus même quand la fenêtre
// de lancement est ouverte (`casting`) : c'est lui qui reçoit le nom tapé, le joueur n'a jamais à recliquer sur le texte.
export default function TypingArea({
  text,
  input,
  active,
  casting = false,
  onKey,
  onAbility,
}: {
  text: string;
  input: string;
  active: boolean;
  casting?: boolean;
  onKey: (key: string) => void;
  onAbility?: (ability: Ability) => void;
}) {
  const t = useTranslations('Race.typing');
  const fieldRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const composing = useRef(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (active) fieldRef.current?.focus();
  }, [active, casting]);

  // La ligne du curseur reste la deuxième ligne visible : le texte défile sous le joueur.
  useLayoutEffect(() => {
    const stream = streamRef.current;
    const top = caretRef.current?.offsetTop ?? 0;
    if (stream) stream.style.transform = `translateY(-${Math.max(0, top - LINE_HEIGHT)}px)`;
  }, [input.length]);

  // Pas de coller (COURSE-04) : `beforeinput` couvre le collage, le glisser-déposer et le « yank », quel que soit le raccourci.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const block = (event: InputEvent) => {
      if (BLOCKED_INPUT_TYPES.has(event.inputType)) event.preventDefault();
    };
    field.addEventListener('beforeinput', block);
    return () => field.removeEventListener('beforeinput', block);
  }, []);

  const sendValue = (field: HTMLInputElement) => {
    const value = field.value;
    field.value = '';
    if (active) for (const char of value) onKey(char);
  };

  return (
    <div className="relative">
      <p className="sr-only">{text}</p>
      <div aria-hidden="true" className="relative h-[156px] overflow-hidden">
        <div ref={streamRef} className="font-typing-stream text-typing-stream transition-transform duration-150">
          {splitWords(text).map((word) => (
            <span key={word.start} className="inline-block whitespace-pre">
              {[...word.chars].map((char, j) => {
                const index = word.start + j;
                const caret = index === input.length;
                return (
                  <span
                    key={index}
                    ref={caret ? caretRef : undefined}
                    data-state={charState(text, input, index)}
                    data-caret={caret || undefined}
                    className={`relative ${CHAR_STYLE[charState(text, input, index)]} ${caret ? 'before:absolute before:top-[14%] before:-left-px before:h-[72%] before:w-[3px] before:animate-pulse before:bg-primary' : ''}`}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          ))}
        </div>
      </div>

      <input
        ref={fieldRef}
        aria-label={t('label')}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          // Ctrl/Cmd+V : coller reste refusé, même si le navigateur ne le signale pas autrement.
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            return;
          }
          const ability = shortcutAbility(e);
          if (ability) {
            e.preventDefault();
            if (active) onAbility?.(ability);
            return;
          }
          // Tab sortirait du champ : la fenêtre de lancement n'aurait plus de clavier.
          if (casting && e.key === 'Tab') e.preventDefault();
          if (e.key !== 'Backspace') return;
          e.preventDefault();
          if (active) onKey(BACKSPACE);
        }}
        onInput={(e) => {
          if (!composing.current) sendValue(e.currentTarget);
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          sendValue(e.currentTarget);
        }}
        className="absolute inset-0 size-full cursor-text opacity-0"
      />

      {active && !focused && (
        <p aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface/75 text-[15px] uppercase tracking-[0.16em] text-on-surface-variant backdrop-blur-[2px]">
          {t('focus')}
        </p>
      )}
    </div>
  );
}
