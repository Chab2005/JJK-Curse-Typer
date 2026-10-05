import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { primaryFace, primaryFrame } from './ReadyPanel';

// Quitter le lobby, sous les paramètres de course, avec l'allure du bouton principal.
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
    <Link href="/lobbies" onClick={leave} className={primaryFrame}>
      <span className={primaryFace}>
        <span aria-hidden="true" className="material-symbols-outlined text-[22px]">logout</span>
        {t('leave')}
      </span>
    </Link>
  );
}
