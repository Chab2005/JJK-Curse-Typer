import { getTranslations, setRequestLocale } from 'next-intl/server';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import RaceHistoryList from '@/components/history/RaceHistoryList';
import PageIntro from '@/components/shared/PageIntro';
import type { Locale } from '@/i18n/config';
import { redirect } from '@/i18n/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { historyPage } from '@/lib/history';
import { historyPageSchema } from '@/lib/schemas';

export async function generateMetadata({ params }: PageProps<'/[locale]/history'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'History' });
  return { title: t('metaTitle') };
}

// Historique des courses du compte connecté (HIST-01), paginé en base ; un visiteur sans compte va à la connexion
// (un invité n'a pas d'historique, AUTH-03).
export default async function HistoryPage({ params, searchParams }: PageProps<'/[locale]/history'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await getSessionUser();
  if (!user) redirect({ href: '/login', locale: locale as Locale });
  const t = await getTranslations('History');
  const { items, page, pageCount } = await historyPage(user!.id, historyPageSchema.parse((await searchParams).page));

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        <section aria-labelledby="history-title" className="relative mx-auto flex max-w-[1040px] flex-col gap-10 px-6 pt-14 pb-24">
          <PageIntro id="history-title" eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} watermark={t('watermark')} chevrons />
          <RaceHistoryList items={items} page={page} pageCount={pageCount} />
        </section>
      </main>
      <Footer />
    </>
  );
}
