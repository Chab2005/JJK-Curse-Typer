import { useTranslations } from 'next-intl';

// Lien d'évitement (A11Y-04) : premier élément atteint au clavier, invisible sauf au focus, il saute l'en-tête vers <main id="main">.
export default function SkipLink() {
  const t = useTranslations('Layout');

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-primary-container focus:px-5 focus:py-3 focus:text-on-primary-container focus:outline-2 focus:outline-offset-2 focus:outline-tertiary"
    >
      {t('skip')}
    </a>
  );
}
