import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { primaryFace, primaryFrame } from './ReadyPanel';

// Quitter le lobby, sous les paramètres de course, avec l'allure du bouton principal.
export default function LeaveLobbyLink() {
  const t = useTranslations('Lobby.actions');

  return (
    <Link href="/lobbies" className={primaryFrame}>
      <span className={primaryFace}>
        <span aria-hidden="true" className="material-symbols-outlined text-[22px]">logout</span>
        {t('leave')}
      </span>
    </Link>
  );
}
