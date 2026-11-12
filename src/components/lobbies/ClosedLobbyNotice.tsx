import { useTranslations } from 'next-intl';

// Bandeau de la liste des lobbies quand on y arrive d'un salon fermé par son hôte (COURSE-11, `?closed=1`).
export default function ClosedLobbyNotice() {
  const t = useTranslations('Lobbies');

  return (
    <p role="status" className="flex items-start gap-3 border-l-[3px] border-secondary bg-secondary-container/20 px-5 py-4 text-on-surface">
      <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-secondary">door_front</span>
      {t('closedNotice')}
    </p>
  );
}
