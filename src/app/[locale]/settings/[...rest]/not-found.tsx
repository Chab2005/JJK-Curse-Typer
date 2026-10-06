import NotFoundPage from '@/components/shared/NotFoundPage';

// Affiché pour /settings/<n'importe quoi> : il n'y a pas de paramètres cachés.
export default function NotFound() {
  return <NotFoundPage variant="settings" />;
}
