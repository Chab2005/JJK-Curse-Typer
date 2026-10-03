// Petit bouton à icône des actions de l'hôte (expulser, donner le rôle d'hôte).
export default function IconButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-10 shrink-0 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  );
}
