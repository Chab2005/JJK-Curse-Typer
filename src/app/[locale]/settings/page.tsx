import { getTranslations, setRequestLocale } from 'next-intl/server';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import SettingsForm from '@/components/settings/SettingsForm';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { getSessionUser } from '@/lib/auth/session';

export async function generateMetadata({ params }: PageProps<'/[locale]/settings'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Settings' });
  return { title: t('title') };
}

// Paramètres du compte (PROF-3, PROF-4, PROF-5) : photo de profil, nom affiché et liens. Réservé aux comptes.
export default async function SettingsPage({ params }: PageProps<'/[locale]/settings'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: '/login', locale: locale as Locale });
  const t = await getTranslations('Settings');
  const avatarUrl = user.hasAvatar ? `/api/avatar/${encodeURIComponent(user.username)}?v=${user.avatarVersion}` : null;

  return (
    <>
      <SiteHeader />
      <main className="relative w-full flex-1 bg-surface">
        <div className="mx-auto flex max-w-[640px] flex-col gap-10 px-6 pt-14 pb-24">
          <header className="flex flex-col gap-2">
            <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
            <h1 className="text-[32px] uppercase tracking-[0.12em]">{t('title')}</h1>
          </header>
          <SettingsForm username={user.username} displayName={user.displayName} avatarUrl={avatarUrl} github={user.github} discord={user.discord} />
        </div>
      </main>
      <Footer />
    </>
  );
}
