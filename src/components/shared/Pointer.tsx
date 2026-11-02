// Petite pointe de flèche devant un libellé (compteurs, état du salon, résumé du profil) ; couleur du texte.
export default function Pointer({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 10 10" className={`size-[7px] shrink-0 rotate-90 ${className}`}>
      <path d="M5 0 10 10 5 7 0 10z" fill="currentColor" />
    </svg>
  );
}
