'use client';

import { useTranslations } from 'next-intl';
import BevelFrame, { goldFrame } from '@/components/shared/BevelFrame';
import { Link } from '@/i18n/navigation';

// Page d'erreur inattendue (I18N-01) : rendue par error.tsx, avec de quoi réessayer ou rentrer à l'accueil.
export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations('Error');

  return (
    <main id="main" className="relative mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-text">{t('eyebrow')}</p>
      <h1 className="text-[clamp(34px,4.5vw,56px)] leading-tight uppercase tracking-[0.08em]">{t('title')}</h1>
      <p className="max-w-[520px] text-lg leading-7 text-on-surface-variant">{t('text')}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-4">
        <BevelFrame
          as="button"
          type="button"
          onClick={reset}
          frame={`group relative flex ${goldFrame}`}
          className="flex min-h-14 items-center gap-3 bg-primary-container px-8 text-[17px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary"
        >
          {t('retry')}
        </BevelFrame>
        <Link href="/" className="flex min-h-14 items-center px-6 text-[15px] uppercase tracking-[0.12em] text-on-surface-variant underline underline-offset-4 hover:text-on-surface">
          {t('home')}
        </Link>
      </div>
    </main>
  );
}
