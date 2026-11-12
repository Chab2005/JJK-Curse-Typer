// Option en plaque pointée (filtres des arènes, tri du classement) : la vraie case ou le vrai bouton radio reste là,
// masqué, pour le clavier et les lecteurs d'écran ; le triangle marque l'option cochée et le cadre s'allume.
export default function PlateOption({ type = 'checkbox', name, checked, onChange, children }: {
  type?: 'checkbox' | 'radio';
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="group hx-cut relative flex flex-1 cursor-pointer bg-[#4a1218] p-px transition-[filter,background-color] [--h:12px] hover:brightness-160 has-checked:bg-primary-container has-focus-visible:bg-primary">
      <span className="hx-cut flex min-h-[38px] flex-1 items-center gap-2.5 bg-linear-to-b from-[#24090d] to-[#0f0405] px-[22px] text-[14px] text-[#c9aeaf] [--h:11.5px] group-has-checked:text-on-primary-container">
        <input type={type} name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <svg aria-hidden="true" viewBox="0 0 10 10" className="size-[7px] shrink-0 rotate-90 text-primary-text opacity-0 group-has-checked:opacity-100">
          <path d="M5 0 10 10 5 7 0 10z" fill="currentColor" />
        </svg>
        {children}
      </span>
    </label>
  );
}
