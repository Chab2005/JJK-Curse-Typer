'use client';

// Champ de recherche avec loupe (lobbies, classement).
export default function SearchField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative flex min-w-0 flex-1 basis-60 items-center">
      <span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute left-4 text-xl text-outline">search</span>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        autoComplete="off"
        spellCheck={false}
        className="font-grotesk min-h-13 w-full border border-surface-container-highest bg-surface-container-lowest pr-4 pl-12 text-lg text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none"
      />
    </div>
  );
}
