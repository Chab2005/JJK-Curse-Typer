import { useTranslations } from 'next-intl';
import BevelPanel from '@/components/shared/BevelPanel';
import ChevronButton from '@/components/shared/ChevronButton';
import { Link } from '@/i18n/navigation';

// Profil d'un compte sans course : pas de statistiques à montrer, donc un message plutôt qu'un tableau de bord vide.
export default function EmptyStats({ own }: { own: boolean }) {
  const t = useTranslations('Profile.empty');

  return (
    <BevelPanel as="section" aria-label={t('label')} className="flex flex-col items-center gap-5 px-6 py-14 text-center">
      <p className="text-lg text-on-surface-variant">{own ? t('own') : t('other')}</p>
      {own && (
        <ChevronButton as={Link} href="/lobbies" variant="primary" className="text-[15px] uppercase tracking-[0.12em]">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">swords</span>
          {t('cta')}
        </ChevronButton>
      )}
    </BevelPanel>
  );
}
