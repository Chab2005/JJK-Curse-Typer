import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthCard from '@/components/auth/AuthCard';
import AuthForm from '@/components/auth/AuthForm';
import OAuthButtons from '@/components/auth/OAuthButtons';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import { loginAction } from '@/app/actions/auth';
import { Link, redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { getSessionUser } from '@/lib/auth/session';

export async function generateMetadata({ params }: PageProps<'/[locale]/login'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Auth' });
  return { title: t('login.title') };
}

// Connexion par pseudo et mot de passe, ou via Discord / GitHub (AUTH-2, AUTH-4).
export default async function LoginPage({ params, searchParams }: PageProps<'/[locale]/login'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  if (await getSessionUser()) redirect({ href: '/', locale: locale as Locale });
  const { error } = await searchParams;
  const t = await getTranslations('Auth');
  const oauthError = error === 'oauthFailed' || error === 'oauthUnavailable' ? error : null;

  return (
    <>
      <SiteHeader />
      <AuthCard
        eyebrow={t('login.eyebrow')}
        title={t('login.title')}
        intro={t('login.intro')}
        footer={
          <>
            {t('login.noAccount')}{' '}
            <Link href="/register" className="text-primary underline underline-offset-4 hover:text-primary-fixed">{t('login.createOne')}</Link>
          </>
        }
      >
        {oauthError && <p role="alert" className="border-l-2 border-error bg-surface-container-lowest p-3 text-[14px] text-error">{t(`errors.${oauthError}`)}</p>}
        <AuthForm mode="login" action={loginAction} />
        <OAuthButtons verb="login" />
      </AuthCard>
      <Footer />
    </>
  );
}
