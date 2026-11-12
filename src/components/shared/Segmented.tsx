'use client';

// Groupe de boutons à choix unique (graphique et clavier du profil, paramètres du lobby) : des plaques pointées,
// cramoisie pour l'option choisie. Le clip-path rognerait le contour de focus : le cadre s'allume à la place.
export default function Segmented<T extends string>({ label, options, value, onChange, optionLabel }: { label: string; options: readonly T[]; value: T; onChange: (value: T) => void; optionLabel: (option: T) => string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1">
      {options.map((option) => {
        const on = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option)}
            className={`hx-cut flex p-px transition-[filter,background-color] [--h:11px] hover:brightness-160 focus-visible:bg-tertiary focus-visible:brightness-150 focus-visible:outline-none ${on ? 'bg-primary-container' : 'bg-[#4a1218]'}`}
          >
            <span
              className={`hx-cut font-label-code flex min-h-[34px] items-center px-5 text-[11px] whitespace-nowrap uppercase tracking-[0.14em] [--h:10.5px] ${on ? 'bg-linear-to-b from-[#e11d48] via-[#a3102f] to-[#6e0718] text-on-primary-container' : 'bg-linear-to-b from-[#24090d] to-[#0f0405] text-[#c9aeaf]'}`}
            >
              {optionLabel(option)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
