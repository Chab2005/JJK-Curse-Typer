import NotFoundPage from '@/components/shared/NotFoundPage';

// 404 par défaut : toute URL qu'aucune route ne connaît (via [...rest]), ex. /FOOBAR ou /lobbies/FOOBAR.
export default function NotFound() {
  return <NotFoundPage variant="page" />;
}
