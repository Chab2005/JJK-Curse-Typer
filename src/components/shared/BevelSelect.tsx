'use client';

import { useEffect, useId, useRef, useState } from 'react';
import BevelFrame from './BevelFrame';
import Reserve from './Reserve';

/** Hauteur de la liste ouverte : une option fait 40px (min-h-10), plus py-2, le cadre et mt-1/mb-1. */
const listHeight = (count: number) => count * 40 + 16 + 2 + 4;

/** Zone visible autour de `el` : la fenêtre, réduite par chaque ancêtre qui rogne son contenu (corps défilant d'une modale…).
 * Une modale ouverte est au-dessus de la page : les ancêtres au-delà d'elle ne la rognent pas. <html> est la fenêtre elle-même. */
function visibleBox(el: HTMLElement) {
  let top = 0;
  let bottom = window.innerHeight;
  for (let parent = el.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
    if (getComputedStyle(parent).overflowY !== 'visible') {
      const rect = parent.getBoundingClientRect();
      top = Math.max(top, rect.top);
      bottom = Math.min(bottom, rect.bottom);
    }
    if (parent.matches('dialog:modal')) break;
  }
  return { top, bottom };
}

// Liste déroulante au cadre biseauté (comme les cartes du salon, mais tout en rouge), à la place d'un <select> dont la liste native ne se stylise pas.
// Motif « combobox sans saisie » de l'APG : le focus reste sur le bouton, les flèches parcourent les options,
// Entrée ou Espace choisit, Échap ou un clic à l'extérieur ferme. Pour des listes courtes (pas de défilement) :
// la liste s'ouvre vers le haut quand la place manque en dessous.
export default function BevelSelect<T extends string | number>({
  id: buttonId,
  labelId,
  options,
  value,
  onChange,
  optionLabel,
}: {
  /** Id du bouton, pour un <label htmlFor>. */
  id?: string;
  /** Id de l'élément qui nomme la liste. */
  labelId: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  optionLabel: (option: T) => string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [upward, setUpward] = useState(false);
  const optionId = (index: number) => `${id}-option-${index}`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const show = (index = options.indexOf(value)) => {
    const root = rootRef.current;
    if (root) {
      const rect = root.getBoundingClientRect();
      const box = visibleBox(root);
      const below = box.bottom - rect.bottom;
      setUpward(below < listHeight(options.length) && rect.top - box.top > below);
    }
    setActive(index);
    setOpen(true);
  };
  const choose = (index: number) => {
    onChange(options[index]);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    const keys: Record<string, () => void> = open
      ? {
          ArrowDown: () => setActive(Math.min(last, active + 1)),
          ArrowUp: () => setActive(Math.max(0, active - 1)),
          Home: () => setActive(0),
          End: () => setActive(last),
          Enter: () => choose(active),
          ' ': () => choose(active),
          Escape: () => setOpen(false),
        }
      : { ArrowDown: () => show(), ArrowUp: () => show(), Enter: () => show(), ' ': () => show(), Home: () => show(0), End: () => show(last) };
    if (e.key === 'Tab') setOpen(false);
    const action = keys[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  };

  // Clés en texte : <Reserve> les attend ainsi, même pour des options numériques.
  const labels: Record<string, string> = Object.fromEntries(options.map((option) => [String(option), optionLabel(option)]));

  return (
    <div ref={rootRef} className="relative">
      <BevelFrame
        as="button"
        id={buttonId}
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        frame="group flex bg-primary-container focus-visible:outline-none"
        className="flex min-h-11 flex-1 items-center gap-3 bg-surface-container-lowest pr-3 pl-4 text-[14px] text-on-surface transition-colors group-hover:bg-surface-container-high group-focus-visible:bg-surface-container-high"
      >
        {/* Largeur de l'option la plus longue : changer d'option ne redimensionne pas le bouton. */}
        <Reserve active={String(value)} variants={labels} className="font-label-code text-left" />
        <span aria-hidden="true" className={`material-symbols-outlined text-[20px]! text-primary transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </BevelFrame>

      <div hidden={!open} className={`absolute left-0 z-30 min-w-full ${upward ? 'bottom-full mb-1' : 'top-full mt-1'} drop-shadow-[0_16px_24px_rgb(0_0_0/0.55)]`}>
        <BevelFrame frame="bg-primary-container" className="bg-surface-container-low">
          {/* mousedown sans effet : le focus reste sur le bouton pendant le clic. */}
          <ul id={`${id}-listbox`} role="listbox" aria-labelledby={labelId} onMouseDown={(e) => e.preventDefault()} className="flex flex-col py-2">
            {options.map((option, index) => (
              <li
                key={option}
                id={optionId(index)}
                role="option"
                aria-selected={option === value}
                onClick={() => choose(index)}
                onMouseEnter={() => setActive(index)}
                className={`font-label-code flex min-h-10 cursor-pointer items-center justify-between gap-4 px-4 text-[14px] whitespace-nowrap transition-colors ${index === active ? 'bg-surface-container-high' : ''} ${option === value ? 'text-primary' : 'text-on-surface'}`}
              >
                {labels[String(option)]}
                <span aria-hidden="true" className={`material-symbols-outlined text-[18px]! ${option === value ? '' : 'invisible'}`}>check</span>
              </li>
            ))}
          </ul>
        </BevelFrame>
      </div>
    </div>
  );
}
