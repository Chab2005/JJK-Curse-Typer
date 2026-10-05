'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BACKSPACE } from '@/game/typing';
import { type CharState, charState, splitWords } from './raceView';

/** Hauteur d'une ligne de texte (text-typing-stream) : trois lignes visibles à la fois. */
const LINE_HEIGHT = 52;

const CHAR_STYLE: Record<CharState, string> = {
  correct: 'text-on-surface',
  // Une faute est soulignée et surlignée, pas seulement colorée (UI-8).
  wrong: 'text-error bg-error-container/45 underline decoration-error decoration-2 underline-offset-[10px]',
  pending: 'text-outline/70',
};

// Zone où le joueur tape (maquette « Course ») : le texte, l'état de chaque caractère et le curseur.
// Un champ invisible posé sur le texte capte la frappe, accents composés compris.
export default function TypingArea({ text, input, active, onKey }: { text: string; input: string; active: boolean; onKey: (key: string) => void }) {
  const t = useTranslations('Race.typing');
  const fieldRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const composing = useRef(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (active) fieldRef.current?.focus();
  }, [active]);

  // La ligne du curseur reste la deuxième ligne visible : le texte défile sous le joueur.
  useLayoutEffect(() => {
    const stream = streamRef.current;
    const top = caretRef.current?.offsetTop ?? 0;
    if (stream) stream.style.transform = `translateY(-${Math.max(0, top - LINE_HEIGHT)}px)`;
  }, [input.length]);

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
        onKeyDown={(e) => {
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
