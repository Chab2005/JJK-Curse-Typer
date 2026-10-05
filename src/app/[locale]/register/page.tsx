import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthCard from '@/components/auth/AuthCard';
import AuthForm from '@/components/auth/AuthForm';
import OAuthButtons from '@/components/auth/OAuthButtons';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import { registerAction } from '@/app/actions/auth';
import { Link, redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { getSessionUser } from '@/lib/auth/session';

export async function generateMetadata({ params }: PageProps<'/[locale]/register'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'Auth' });
  return { title: t('register.title') };
}

// Inscription : pseudo + mot de passe, sans autre champ (AUTH-2), ou via Discord / GitHub (AUTH-4).
export default async function RegisterPage({ params }: PageProps<'/[locale]/register'>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  if (await getSessionUser()) redirect({ href: '/', locale: locale as Locale });
  const t = await getTranslations('Auth');

  return (
    <>
      <SiteHeader />
      <AuthCard
        eyebrow={t('register.eyebrow')}
        title={t('register.title')}
        intro={t('register.intro')}
        footer={
          <>
            {t('register.haveAccount')}{' '}
            <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary-fixed">{t('register.logIn')}</Link>
          </>
        }
      >
        <AuthForm mode="register" action={registerAction} />
        <OAuthButtons verb="register" />
      </AuthCard>
      <Footer />
    </>
  );
}
