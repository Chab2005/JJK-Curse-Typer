import BevelFrame from '@/components/shared/BevelFrame';

// Case à cocher en pastille biseautée : la vraie case reste là (masquée) pour le clavier et les lecteurs d'écran.
// La coche garde sa place décochée, pour que la pastille ne change pas de taille.
// `relative` : la case masquée (absolue) reste dans la pastille ; sinon elle se place par rapport à la fenêtre,
// sous le corps défilant, et le focus au clic fait défiler toute la fenêtre.
export default function BevelCheck({ checked, onChange, disabled = false, children }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <BevelFrame
      as="label"
      frame="group relative flex cursor-pointer bg-outline-variant transition-colors hover:bg-primary has-checked:bg-primary-container has-checked:hover:bg-primary has-focus-visible:bg-primary has-disabled:cursor-not-allowed has-disabled:hover:bg-primary-container"
      className="flex min-h-10 flex-1 items-center gap-2 bg-surface-container-lowest pr-4 pl-3 text-[14px] text-on-surface-variant transition-colors group-has-checked:bg-surface-container-high group-has-checked:text-on-surface"
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span aria-hidden="true" className="material-symbols-outlined text-[16px]! text-primary invisible group-has-checked:visible">check</span>
      {children}
    </BevelFrame>
  );
}
