'use client';

// Champ de recherche avec loupe (lobbies, classement).
// Mêmes bouts biseautés que le bouton Filtres : le clip-path mange la bordure,
// donc le contour est le fond du conteneur (p-px) qui dépasse sous le champ.
export default function SearchField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="diamond-ends relative flex min-w-0 flex-1 basis-60 items-center bg-surface-container-highest p-px transition-colors focus-within:bg-primary-container">
      <span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute left-4 z-10 text-xl text-outline">search</span>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        autoComplete="off"
        spellCheck={false}
        className="diamond-ends font-grotesk min-h-[50px] w-full bg-surface-container-lowest pr-6 pl-12 text-lg text-on-surface placeholder:text-outline focus:outline-none"
      />
    </div>
  );
}
