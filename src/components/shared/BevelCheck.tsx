// Case à cocher en plaque pointée cramoisie (paramètres du lobby, touche Maj du clavier), comme les filtres des arènes :
// la vraie case reste là (masquée) pour le clavier et les lecteurs d'écran, la pointe marque l'état coché et le cadre s'allume.
// La pointe garde sa place décochée, pour que la plaque ne change pas de taille.
// `relative` : la case masquée (absolue) reste dans la plaque ; sinon elle se place par rapport à la fenêtre,
// sous le corps défilant, et le focus au clic fait défiler toute la fenêtre.
export default function BevelCheck({ checked, onChange, disabled = false, children }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <label className="group hx-cut relative flex cursor-pointer bg-[#4a1218] p-px transition-[filter,background-color] [--h:12px] hover:brightness-160 has-checked:bg-primary-container has-focus-visible:bg-tertiary has-disabled:cursor-not-allowed has-disabled:hover:brightness-100">
      <span className="hx-cut flex min-h-[38px] flex-1 items-center gap-2.5 bg-linear-to-b from-[#24090d] to-[#0f0405] pr-5 pl-[22px] text-[14px] text-[#c9aeaf] [--h:11.5px] group-has-checked:text-on-primary-container">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <svg aria-hidden="true" viewBox="0 0 10 10" className="size-[7px] shrink-0 rotate-90 text-primary-container opacity-0 group-has-checked:opacity-100">
          <path d="M5 0 10 10 5 7 0 10z" fill="currentColor" />
        </svg>
        {children}
      </span>
    </label>
  );
}
