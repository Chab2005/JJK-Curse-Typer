import NotFoundPage from '@/components/shared/NotFoundPage';

// Affiché par notFound() quand la course demandée n'est pas dans l'historique de ce joueur (HIST-02).
export default function NotFound() {
  return <NotFoundPage variant="otherRace" />;
}
