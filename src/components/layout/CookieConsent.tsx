'use client';

import { useTranslations } from 'next-intl';
import BevelPanel from '@/components/shared/BevelPanel';
import ChevronButton from '@/components/shared/ChevronButton';
import { chooseConsent, useConsentOpen } from './consentStore';

// Carte des cookies (canvas « Bandeau cookies · style cramoisi », variante carte) : en bas à droite, par-dessus la page,
// sans voler le focus. Accepter laisse le proxy mémoriser la langue ; Refuser l'oublie. Les cookies essentiels restent.
export default function CookieConsent() {
  const t = useTranslations('CookieConsent');
  const open = useConsentOpen();
  if (!open) return null;

  return (
    <BevelPanel
      as="section"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-body"
      frame="cookie-rise fixed right-4 bottom-4 left-4 z-50 sm:left-auto sm:right-10 sm:bottom-10 sm:w-[520px] [filter:drop-shadow(0_18px_40px_rgb(0_0_0/0.6))_drop-shadow(0_0_24px_rgb(225_29_72/0.18))]"
      className="flex flex-col gap-[18px] px-6 py-6 sm:px-8"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="cookie-consent-title"
          className="flex items-center gap-2.5 font-label-code text-[12px] font-bold uppercase tracking-[0.28em] text-primary-container"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px] tracking-normal normal-case">
            cookie
          </span>
          {t('title')}
        </h2>
        <p id="cookie-consent-body" className="text-[17px] leading-[26px] text-on-surface">
          {t('body')}
        </p>
        <p className="text-[14px] leading-5 text-outline">{t('note')}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <ChevronButton
          type="button"
          size="sm"
          chevrons={false}
          onClick={() => chooseConsent('declined')}
          className="font-label-code text-[12px] uppercase tracking-[0.16em]"
        >
          {t('decline')}
        </ChevronButton>
        <ChevronButton
          type="button"
          size="sm"
          variant="primary"
          onClick={() => chooseConsent('accepted')}
          className="font-label-code text-[12px] uppercase tracking-[0.16em]"
        >
          {t('accept')}
        </ChevronButton>
      </div>
    </BevelPanel>
  );
}
