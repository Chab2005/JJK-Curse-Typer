import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import AuthCard from '@/components/auth/AuthCard';
import AuthForm from '@/components/auth/AuthForm';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import { completeOAuthAction } from '@/app/actions/auth';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { OAUTH_PENDING_COOKIE } from '@/lib/auth/config';

export async function generateMetadata({ params }: PageProps<'/[locale]/register/oauth'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Auth' });
  return { title: t('oauthComplete.title') };
}

// Premier accès par OAuth : on choisit un pseudo et un mot de passe (AUTH-4). Sans identité en attente, retour à l'inscription.
export default async function CompleteOAuthPage({ params }: PageProps<'/[locale]/register/oauth'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  if (!(await cookies()).get(OAUTH_PENDING_COOKIE)) redirect({ href: '/register', locale: locale as Locale });
  const t = await getTranslations('Auth');

  return (
    <>
      <SiteHeader />
      <AuthCard eyebrow={t('oauthComplete.eyebrow')} title={t('oauthComplete.title')} intro={t('oauthComplete.intro')}>
        <AuthForm mode="oauth" action={completeOAuthAction} />
      </AuthCard>
      <Footer />
    </>
  );
}
