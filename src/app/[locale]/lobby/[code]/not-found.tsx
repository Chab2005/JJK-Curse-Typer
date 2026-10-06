import NotFoundPage from '@/components/shared/NotFoundPage';

// Affiché par notFound() quand aucun lobby n'a le code demandé.
export default function NotFound() {
  return <NotFoundPage variant="lobby" />;
}
