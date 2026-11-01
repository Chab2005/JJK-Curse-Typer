import { getTranslations, setRequestLocale } from 'next-intl/server';
import CharacterGrid from '@/components/characters/CharacterGrid';
import GameGuide from '@/components/characters/GameGuide';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import PageIntro from '@/components/shared/PageIntro';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({ params }: PageProps<'/[locale]/characters'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'CharactersPage' });
  return { title: t('metaTitle') };
}

// Personnages jouables (anciennement « Archives ») et guide de jeu : énergie et bonus (BON-1 à BON-8).
export default async function CharactersPage({ params }: PageProps<'/[locale]/characters'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('CharactersPage');

  return (
    <>
      <SiteHeader />
      <main className="relative w-full flex-1 overflow-hidden bg-surface-container-lowest">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        <section aria-labelledby="characters-page-title" className="relative mx-auto flex max-w-[1152px] flex-col gap-11 px-6 pt-14 pb-[140px]">
          <PageIntro id="characters-page-title" eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} watermark={t('watermark')} />
          <CharacterGrid />
        </section>
        <GameGuide />
      </main>
      <Footer />
    </>
  );
}
