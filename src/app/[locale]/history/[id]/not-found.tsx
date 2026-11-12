import NotFoundPage from '@/components/shared/NotFoundPage';

// Affiché par notFound() quand la course demandée n'est pas dans l'historique du joueur (HIST-02).
export default function NotFound() {
  return <NotFoundPage variant="race" />;
}
