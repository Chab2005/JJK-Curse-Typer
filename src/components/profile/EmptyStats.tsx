import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// Profil d'un compte sans course : pas de statistiques à montrer, donc un message plutôt qu'un tableau de bord vide.
export default function EmptyStats({ own }: { own: boolean }) {
  const t = useTranslations('Profile.empty');

  return (
    <section aria-label={t('label')} className="flex flex-col items-center gap-4 border border-dashed border-outline-variant px-6 py-14 text-center">
      <p className="text-lg text-on-surface-variant">{own ? t('own') : t('other')}</p>
      {own && (
        <Link
          href="/lobbies"
          className="flex min-h-12 items-center gap-2.5 border border-on-surface px-[22px] text-sm uppercase tracking-[0.16em] text-on-surface transition-colors hover:bg-on-surface hover:text-surface-container-lowest"
        >
          {t('cta')}
          <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
      )}
    </section>
  );
}
