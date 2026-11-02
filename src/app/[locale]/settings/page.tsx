import { getTranslations, setRequestLocale } from 'next-intl/server';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import SettingsForm from '@/components/settings/SettingsForm';
import PageIntro from '@/components/shared/PageIntro';
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
      <main className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[640px] bg-linear-to-b from-transparent to-[#120708]" />
        <div className="relative mx-auto flex max-w-[760px] flex-col gap-7 px-6 pt-14 pb-24">
          <PageIntro id="settings-title" eyebrow={t('eyebrow')} title={t('title')} watermark={t('eyebrow')} chevrons />
          <SettingsForm username={user.username} displayName={user.displayName} avatarUrl={avatarUrl} github={user.github} discord={user.discord} />
        </div>
      </main>
      <Footer />
    </>
  );
}
