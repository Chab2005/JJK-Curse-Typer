import NotFoundPage from '@/components/shared/NotFoundPage';

// Affiché par notFound() quand aucun personnage jouable n'a cet identifiant.
export default function NotFound() {
  return <NotFoundPage variant="character" />;
}
