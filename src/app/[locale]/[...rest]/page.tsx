import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({ params }: PageProps<'/[locale]/[...rest]'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'NotFound' });
  return { title: t('page.metaTitle') };
}

// Attrape les URL sans route pour afficher la 404 du site (not-found.tsx de [locale]) dans la mise en page.
export default function CatchAllPage() {
  notFound();
}
