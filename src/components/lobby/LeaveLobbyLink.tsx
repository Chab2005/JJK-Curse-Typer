import { useTranslations } from 'next-intl';
import ChevronButton from '@/components/shared/ChevronButton';
import { Link, useRouter } from '@/i18n/navigation';
import { actionFace } from './ReadyPanel';

// Quitter le lobby, sous les paramètres de course : grand bouton-flèche sombre.
// `onLeave` (lobby créé) : le départ est d'abord enregistré, pour que le salon le voie tout de suite.
export default function LeaveLobbyLink({ onLeave }: { onLeave?: () => Promise<void> }) {
  const t = useTranslations('Lobby.actions');
  const router = useRouter();

  const leave = async (e: React.MouseEvent) => {
    if (!onLeave) return;
    e.preventDefault();
    await onLeave().catch(() => {});
    router.push('/lobbies');
  };

  return (
    <ChevronButton as={Link} href="/lobbies" onClick={leave} frame="w-full" className={actionFace}>
      <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary">logout</span>
      {t('leave')}
    </ChevronButton>
  );
}
