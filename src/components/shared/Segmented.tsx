'use client';

// Groupe de boutons à choix unique (graphique et clavier du profil, paramètres du lobby).
export default function Segmented<T extends string>({ label, options, value, onChange, optionLabel }: { label: string; options: readonly T[]; value: T; onChange: (value: T) => void; optionLabel: (option: T) => string }) {
  return (
    <div role="group" aria-label={label} className="flex border border-surface-container-highest bg-surface-container-lowest p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className={`font-label-code min-h-9 px-3 text-[12px] uppercase transition-colors ${option === value ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          {optionLabel(option)}
        </button>
      ))}
    </div>
  );
}
