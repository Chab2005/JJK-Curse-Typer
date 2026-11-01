'use client';

// Champ de recherche avec loupe (lobbies, classement), à bouts pointus en quatre couches comme les boutons-flèches :
// cadre, vide, filet et face, chaque couche un peu moins pointue. Le cadre et le filet s'allument au focus.
export default function SearchField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="group hx-cut relative flex min-w-0 flex-1 basis-60 bg-[#8f1022] p-px transition-colors [--h:18px] focus-within:bg-primary-container">
      <div className="hx-cut flex flex-1 bg-[#0b0405] p-[3px] [--h:17.5px]">
        <div className="hx-cut flex flex-1 bg-primary-container/40 p-px transition-colors [--h:16px] group-focus-within:bg-primary/55">
          <span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute top-1/2 left-[34px] z-10 -translate-y-1/2 text-xl text-outline">search</span>
          <label htmlFor={id} className="sr-only">{label}</label>
          <input
            id={id}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={label}
            autoComplete="off"
            spellCheck={false}
            className="hx-cut font-grotesk h-[46px] w-full bg-[radial-gradient(120%_160%_at_50%_0%,#2a0b10_0%,#170608_55%,#0c0304_100%)] pr-[30px] pl-[60px] text-lg text-on-surface [--h:15.5px] placeholder:text-[#7d6162] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
