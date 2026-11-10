import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

/** Délai entre deux relectures de la liste des lobbies. */
export const LOBBY_REFRESH_MS = 5000;

// Liste des lobbies à jour sans recharger la page (JOIN-02) : la page serveur se recalcule à chaque requête, `router.refresh()`
// la redemande et garde l'état du client (recherche, page). Rien ne tourne dans un onglet caché, et le retour à l'onglet relit aussitôt.
export function useAutoRefresh(interval = LOBBY_REFRESH_MS) {
  const router = useRouter();

  useEffect(() => {
    const visible = () => document.visibilityState !== 'hidden';
    const timer = setInterval(() => visible() && router.refresh(), interval);
    const onVisibility = () => visible() && router.refresh();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [router, interval]);
}
