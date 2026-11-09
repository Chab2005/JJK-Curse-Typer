'use client';

import ErrorPage from '@/components/shared/ErrorPage';

// Erreur inattendue d'une page : message traduit et bouton pour réessayer (I18N-01).
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPage reset={reset} />;
}
