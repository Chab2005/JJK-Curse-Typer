import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import CharacterSheet from '@/components/characters/CharacterSheet';
import { findCharacter } from '@/components/characters/characterPages';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({ params }: PageProps<'/[locale]/characters/[id]'>) {
  const { id } = await params;
  return { title: findCharacter(id)?.name };
}

// Fiche d'un personnage jouable : technique, capacité en course, fiches voisines.
export default async function CharacterPage({ params }: PageProps<'/[locale]/characters/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const character = findCharacter(id);
  if (!character) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative w-full flex-1 overflow-hidden bg-surface-container-lowest">
        <CharacterSheet character={character} />
      </main>
      <Footer />
    </>
  );
}
