import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import RaceHistoryList from '@/components/history/RaceHistoryList';
import PageIntro from '@/components/shared/PageIntro';
import type { Locale } from '@/i18n/config';
import { redirect } from '@/i18n/navigation';
import { findAccountProfile } from '@/lib/auth/profile';
import { getSessionUser } from '@/lib/auth/session';
import { historyPage } from '@/lib/history';
import { historyPageSchema, usernameParamSchema } from '@/lib/schemas';

// Métadonnées et page lisent le même joueur : une seule lecture par requête.
const loadOwner = cache(async (username: string) => {
  const parsed = usernameParamSchema.safeParse(username);
  return parsed.success ? findAccountProfile(parsed.data) : null;
});

export async function generateMetadata({ params }: PageProps<'/[locale]/profile/[username]/history'>) {
  const { locale, username } = await params;
  const owner = await loadOwner(username);
  if (!owner) return { title: (await getTranslations({ locale: locale as Locale, namespace: 'NotFound' }))('profile.metaTitle') };
  return { title: (await getTranslations({ locale: locale as Locale, namespace: 'History.other' }))('metaTitle', { name: owner.displayName }) };
}

// Historique des courses d'un autre joueur (HIST-01), ouvert à tout compte connecté depuis le profil de ce joueur.
// Le sien reste sur /history ; sans session, renvoi à la connexion.
export default async function PlayerHistoryPage({ params, searchParams }: PageProps<'/[locale]/profile/[username]/history'>) {
  const { locale, username } = await params;
  setRequestLocale(locale as Locale);
  const viewer = await getSessionUser();
  if (!viewer) redirect({ href: '/login', locale: locale as Locale });
  const owner = await loadOwner(username);
  if (!owner) notFound();
  if (owner.id === viewer!.id) redirect({ href: '/history', locale: locale as Locale });
  const t = await getTranslations('History.other');
  const { items, page, pageCount } = await historyPage(owner.id, historyPageSchema.parse((await searchParams).page));
  const name = owner.displayName;

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        <section aria-labelledby="history-title" className="relative mx-auto flex max-w-[1040px] flex-col gap-10 px-6 pt-14 pb-24">
          <PageIntro id="history-title" eyebrow={t('eyebrow')} title={t('title', { name })} intro={t('intro', { name })} watermark={owner.username} chevrons />
          <RaceHistoryList items={items} page={page} pageCount={pageCount} basePath={`/profile/${encodeURIComponent(owner.username)}/history`} empty={t('empty', { name })} />
        </section>
      </main>
      <Footer />
    </>
  );
}
