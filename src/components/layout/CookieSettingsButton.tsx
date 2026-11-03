'use client';

import { useTranslations } from 'next-intl';
import { reopenConsent } from './consentStore';

// Lien « Cookies » du pied de page : rouvre la carte pour changer d'avis.
export default function CookieSettingsButton() {
  const t = useTranslations('CookieConsent');

  return (
    <button
      type="button"
      onClick={reopenConsent}
      className="cursor-pointer py-1.5 text-[13px] uppercase tracking-[0.16em] text-on-surface-variant transition-colors hover:text-on-primary-container"
    >
      {t('settings')}
    </button>
  );
}
