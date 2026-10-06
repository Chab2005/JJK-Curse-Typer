import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({ params }: PageProps<'/[locale]/settings/[...rest]'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'NotFound' });
  return { title: t('settings.metaTitle') };
}

// Les paramètres n'ont pas de sous-pages : /settings/<n'importe quoi> répond 404.
export default function UnknownSettingsPage() {
  notFound();
}
